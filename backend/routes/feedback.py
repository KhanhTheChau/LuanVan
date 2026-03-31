from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_db
from routes.auth import require_admin
from bson import ObjectId

feedback_bp = Blueprint("feedback", __name__)

@feedback_bp.route("/predict_feedback", methods=["POST"])
def submit_feedback():
    import os
    import uuid
    from datetime import datetime
    
    # Log received files and form data
    print(f"[BACKEND] Feedback Request Files: {request.files}")
    print(f"[BACKEND] Feedback Request Data: {request.form}")
    
    # Get metadata from form (multipart)
    predicted_label = request.form.get("predicted_label", "unknown")
    confidence = request.form.get("confidence", 0)
    feedback_type = request.form.get("feedback_type", "unknown")
    
    db = get_db()
    
    # Image Saving Logic
    image_path = None
    if 'image' in request.files:
        file = request.files['image']
        if file.filename != '':
            # Ensure upload directory exists
            upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            
            # Generate unique filename
            filename = f"feedback_{uuid.uuid4().hex}.jpg"
            save_path = os.path.join(upload_dir, filename)
            file.save(save_path)
            
            # Formatted path for DB/Frontend
            image_path = f"/public/uploads/{filename}"
            print(f"[BACKEND] Feedback image saved to: {image_path}")

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
        "image_path": image_path,
        "predicted_label": predicted_label,
        "confidence": float(confidence) if confidence else 0.0,
        "feedback_type": feedback_type,
        "status": "pending",
        "created_at": datetime.utcnow()
    })
    
    return jsonify({"success": True, "image_path": image_path})

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
            
        # Normalize Path: ALWAYS use /public/uploads/ + filename for consistency
        raw_p = doc.get("image_path", "")
        if raw_p:
            import os
            # Extract just the filename (ignores slashes, backslashes, absolute paths)
            filename = os.path.basename(raw_p.replace("\\", "/"))
            doc["image_path"] = f"/public/uploads/{filename}"
        else:
            doc["image_path"] = None
            
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
