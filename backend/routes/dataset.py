from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import Binary
from db import get_db
from routes.auth import require_admin

dataset_bp = Blueprint("dataset", __name__)

@dataset_bp.route("/add", methods=["POST"])
def add_dataset():
    files = request.files.getlist("images")
    label = request.form.get("label")
    data_split = request.form.get("split", "train")
    
    if not files:
        return jsonify({"error": "No images provided"}), 400
    if not label:
        return jsonify({"error": "Label is required"}), 400
        
    db = get_db()
    added_count = 0
    
    for file in files:
        if file.filename == "":
            continue
        
        # Checking format
        ext = file.filename.split('.')[-1].lower()
        if ext not in ['jpg', 'jpeg', 'png']:
            continue
            
        img_bytes = file.read()
        if len(img_bytes) > 5 * 1024 * 1024:
            continue
            
        # Insert image block into MongoDB
        now = datetime.utcnow()
        doc = {
            "filename": file.filename,
            "image_data": Binary(img_bytes),
            "label": label,
            "predict_label": "",
            "vote_scores": {},
            "status": "pending",
            "metadata": {},
            "data_split": data_split,
            "is_noisy": False,
            "created_at": now,
            "updated_at": now
        }
        db.images.insert_one(doc)
        added_count += 1
        
    total_images = db.images.count_documents({})
        
    return jsonify({
        "message": "Successfully added images to dataset",
        "added_count": added_count,
        "target_label": label,
        "split": data_split,
        "dataset_total": total_images
    })

@dataset_bp.route("", methods=["GET"])
def list_dataset():
    try:
        limit = int(request.args.get("limit", 50))
        skip = int(request.args.get("skip", 0))
    except ValueError:
        return jsonify({"error": "Invalid pagination params"}), 400

    is_noisy_param = request.args.get("is_noisy")
    
    query = {}
    if is_noisy_param is not None:
        query["is_noisy"] = is_noisy_param.lower() == "true"
        
    db = get_db()
    total = db.images.count_documents(query)
    
    # Exclude image_data to save bandwidth!
    cursor = db.images.find(query, {"image_data": 0}).skip(skip).limit(limit)
    
    images = []
    for doc in cursor:
        img_data = {
            "id": str(doc["_id"]),
            "filename": doc["filename"],
            "label": doc["label"],
            "split": doc.get("data_split", "train"),
            "is_noisy": doc.get("is_noisy", False)
        }
        # If analyzed, it will have vote_scores
        if "vote_scores" in doc and doc["vote_scores"]:
            vs = doc["vote_scores"]
            img_data["V1"] = vs.get("v1_cam")
            img_data["V2"] = vs.get("v2_crop")
            img_data["V3"] = vs.get("v3_loss")
            img_data["V4"] = vs.get("v4_tta")
            img_data["V5"] = vs.get("v5_ens")
            img_data["total_score"] = vs.get("total_score", doc.get("total_score"))
            
        images.append(img_data)
        
    return jsonify({
        "total": total,
        "images": images
    })

@dataset_bp.route("/analyze", methods=["POST"])
@require_admin
def analyze_dataset():
    data = request.get_json() or {}
    limit = data.get("limit", None)
    
    # We trigger the Celery background task
    from tasks import analyze_dataset_task
    task = analyze_dataset_task.delay(limit)
    
    return jsonify({
        "message": "Analyze task started in background",
        "task_id": task.id
    })
