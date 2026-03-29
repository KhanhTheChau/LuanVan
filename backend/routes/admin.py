import os
from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
from db import get_db

admin_bp = Blueprint("admin_api", __name__)

def parse_json(data):
    """ Helper to parse MongoDB '_id' to string """
    import json
    from bson import json_util
    return json.loads(json_util.dumps(data))

@admin_bp.route("/dashboard", methods=["GET"])
def get_dashboard_summary():
    db = get_db()
    experiments = list(db.experiments.find({}))
    
    total_exps = len(experiments)
    done_exps = [e for e in experiments if e.get("status") == "done"]
    
    avg_acc_before = sum([e.get("acc_before", 0) for e in done_exps]) / len(done_exps) if done_exps else 0
    avg_acc_after = sum([e.get("acc_after", 0) for e in done_exps]) / len(done_exps) if done_exps else 0
    avg_improvement = sum([e.get("improvement", 0) for e in done_exps]) / len(done_exps) if done_exps else 0
    
    chart_data = [{"name": e.get("name", "Unknown"), "Acc Before": e.get("acc_before", 0), "Acc After": e.get("acc_after", 0)} for e in done_exps]
    
    return jsonify({
        "total_experiments": total_exps,
        "completed_experiments": len(done_exps),
        "avg_acc_before": round(avg_acc_before, 2),
        "avg_acc_after": round(avg_acc_after, 2),
        "avg_improvement": round(avg_improvement, 2),
        "chart_data": chart_data
    })

@admin_bp.route("/models", methods=["GET"])
def get_models():
    # Use preload cache if better, or just query
    from services.cache import get_cache
    cache = get_cache()
    if cache.models:
        return jsonify(parse_json(cache.models))
        
    db = get_db()
    models = list(db.models.find({}))
    return jsonify(parse_json(models))

@admin_bp.route("/experiments", methods=["GET", "POST"])
def experiments():
    db = get_db()
    if request.method == "POST":
        data = request.json
        name = data.get("name", f"Experiment {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        model_name = data.get("model_name", "m1_resnet.pth")
        method = data.get("method", "Knowledge Distillation")
        
        doc = {
            "name": name,
            "model_name": model_name,
            "method": method,
            "status": "pending",
            "acc_before": 0,
            "acc_after": 0,
            "improvement": 0,
            "noisy_count": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        res = db.experiments.insert_one(doc)
        exp_id = str(res.inserted_id)
        
        # Trigger Celery
        from tasks import run_experiment_task
        run_experiment_task.delay(exp_id, model_name, method)
        
        return jsonify({"message": "Experiment started", "id": exp_id})
        
    else:
        exps = list(db.experiments.find({}).sort("created_at", -1))
        return jsonify(parse_json(exps))

@admin_bp.route("/experiments/<id>", methods=["GET"])
def get_experiment(id):
    db = get_db()
    exp = db.experiments.find_one({"_id": ObjectId(id)})
    if not exp: return jsonify({"error": "Not found"}), 404
    return jsonify(parse_json(exp))

@admin_bp.route("/experiments/<id>/logs", methods=["GET"])
def get_experiment_logs(id):
    db = get_db()
    logs = list(db.training_logs.find({"experiment_id": id}).sort("epoch", 1))
    return jsonify(parse_json(logs))

@admin_bp.route("/dataset", methods=["GET"])
def get_dataset():
    db = get_db()
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    skip = (page - 1) * limit
    
    query = {}
    is_noisy_q = request.args.get('is_noisy')
    if is_noisy_q in ['true', 'True', '1']:
        query['is_noisy'] = True
    elif is_noisy_q in ['false', 'False', '0']:
        query['is_noisy'] = False
        
    total = db.images.count_documents(query)
    images = list(db.images.find(query).skip(skip).limit(limit))
    
    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "data": parse_json(images)
    })

@admin_bp.route("/dataset/analyze", methods=["GET"])
def analyze_dataset():
    # Use Preload Cache
    from services.cache import get_cache
    cache = get_cache()
    if not cache.is_loaded:
        cache.preload()
    return jsonify(cache.dataset_stats)

@admin_bp.route("/feedback", methods=["GET"])
def get_feedback():
    db = get_db()
    fb = list(db.prediction_feedback.find({}).sort("created_at", -1))
    return jsonify(parse_json(fb))

@admin_bp.route("/feedback/<id>", methods=["PUT"])
def update_feedback(id):
    db = get_db()
    status = request.json.get("status")
    if status not in ["approved", "rejected"]:
        return jsonify({"error": "Invalid status"}), 400
        
    db.prediction_feedback.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return jsonify({"message": "Feedback updated"})

@admin_bp.route("/dataset/image/<image_id>", methods=["GET"])
def get_image_binary(image_id):
    import io, os
    from flask import send_file
    db = get_db()
    try:
        doc = db.images.find_one({"_id": ObjectId(image_id)})
    except Exception:
        return jsonify({"error": "Invalid image ID"}), 400
        
    if not doc:
        return jsonify({"error": "Image not found"}), 404
        
    # Case 1: Image data is in DB as binary
    if "image_data" in doc:
        # Standardize to bytes for send_file
        img_data = doc["image_data"]
        if not isinstance(img_data, bytes):
            img_data = bytes(img_data)
            
        return send_file(
            io.BytesIO(img_data),
            mimetype='image/jpeg',
            download_name=doc.get("filename", "image.jpg")
        )
    
    # Case 2: Image is on local disk
    if "file_path" in doc:
        # Go up 2 levels from backend/routes to get project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        file_path = os.path.join(project_root, doc["file_path"])
        
        if os.path.exists(file_path):
            return send_file(file_path)
            
    return jsonify({"error": "Image content not found on server"}), 404
