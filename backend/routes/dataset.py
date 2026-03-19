import os
import io
from flask import Blueprint, request, jsonify, send_file
from datetime import datetime
from bson import Binary, ObjectId
from db import get_db
from routes.auth import require_admin

dataset_bp = Blueprint("dataset", __name__)

@dataset_bp.route("/dataset/add", methods=["POST"])
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

@dataset_bp.route("/images", methods=["GET"])
def list_dataset():
    try:
        limit = int(request.args.get("limit", 20))
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
    cursor = db.images.find(query, {"image_data": 0}).skip(skip).limit(limit).sort("created_at", -1)
    
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

@dataset_bp.route("/dataset/stats", methods=["GET"])
def get_dataset_stats():
    db = get_db()
    
    # 1. Total images
    total_images = db.images.count_documents({})
    
    # 2. Noisy count
    noisy_count = db.images.count_documents({"is_noisy": True})
    
    # 3. Label distribution
    label_pipeline = [
        {"$group": {"_id": "$label", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    label_counts = {item["_id"]: item["count"] for item in db.images.aggregate(label_pipeline)}
    
    # 4. Split distribution
    split_pipeline = [
        {"$group": {"_id": "$data_split", "count": {"$sum": 1}}}
    ]
    split_counts = {item["_id"]: item["count"] for item in db.images.aggregate(split_pipeline)}
    
    return jsonify({
        "total_images": total_images,
        "noisy_count": noisy_count,
        "label_counts": label_counts,
        "split_counts": split_counts
    })

@dataset_bp.route("/dataset/image/<image_id>", methods=["GET"])
def get_image_binary(image_id):
    db = get_db()
    try:
        doc = db.images.find_one({"_id": ObjectId(image_id)})
    except Exception:
        return jsonify({"error": "Invalid image ID"}), 400
        
    if not doc:
        return jsonify({"error": "Image not found"}), 404
        
    # Case 1: Image data is in DB as binary
    if "image_data" in doc:
        return send_file(
            io.BytesIO(doc["image_data"]),
            mimetype='image/jpeg',
            download_name=doc.get("filename", "image.jpg")
        )
    
    # Case 2: Image is on local disk
    if "file_path" in doc:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(project_root, doc["file_path"])
        
        if os.path.exists(file_path):
            return send_file(file_path)
            
    return jsonify({"error": "Image content not found on server"}), 404

@dataset_bp.route("/system/stats", methods=["GET"])
def get_system_stats():
    db = get_db()
    
    total_users = db.users.count_documents({})
    total_feedback = db.prediction_feedback.count_documents({})
    total_predictions = db.prediction_history.count_documents({})
    
    return jsonify({
        "total_users": total_users,
        "total_feedback": total_feedback,
        "total_predictions": total_predictions
    })

@dataset_bp.route("/dataset/analyze", methods=["POST"])
@require_admin
def analyze_dataset():
    data = request.get_json() or {}
    limit = data.get("limit", None)
    
    from tasks import analyze_dataset_task
    task = analyze_dataset_task.delay(limit)
    
    return jsonify({
        "message": "Analyze task started in background",
        "task_id": task.id
    })


