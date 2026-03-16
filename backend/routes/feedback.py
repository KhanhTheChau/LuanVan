from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_db
from routes.auth import require_admin
from bson import ObjectId

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/predict_feedback", methods=["POST"])
def submit_feedback():
    data = request.json
    db = get_db()
    
    # Try to extract user_id if logged in
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        session = db.sessions.find_one({"token": token})
        if session:
            user_id = session.get("user_id")
            
    db.prediction_feedback.insert_one({
        "user_id": user_id,
        "image_path": data.get("image_path"),
        "predicted_label": data.get("predicted_label"),
        "confidence": data.get("confidence"),
        "feedback_type": data.get("feedback_type"),
        "status": "pending",
        "created_at": datetime.utcnow()
    })
    
    return jsonify({"success": True})

@feedback_bp.route("/admin/feedback", methods=["GET"])
@require_admin
def get_feedback():
    db = get_db()
    cursor = db.prediction_feedback.find().sort("created_at", -1)
    feedbacks = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if doc.get("created_at"):
            doc["created_at"] = doc["created_at"].isoformat()
        feedbacks.append(doc)
        
    return jsonify({"success": True, "feedbacks": feedbacks})

@feedback_bp.route("/admin/feedback/update", methods=["POST"])
@require_admin
def update_feedback():
    data = request.json
    feedback_id = data.get("feedback_id")
    status = data.get("status")
    
    if not feedback_id or not status:
         return jsonify({"success": False, "message": "Missing fields"}), 400
         
    db = get_db()
    db.prediction_feedback.update_one(
        {"_id": ObjectId(feedback_id)},
        {"$set": {"status": status}}
    )
    
    return jsonify({"success": True})
