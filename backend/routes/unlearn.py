import uuid
from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_db

unlearn_bp = Blueprint("unlearn", __name__)

@unlearn_bp.route("/start", methods=["POST"])
def start_unlearning():
    data = request.get_json() or {}
    epochs = data.get("epochs", 3)
    lam = data.get("lambda", 0.5)
    temperature = data.get("temperature", 2.0)
    
    job_id = str(uuid.uuid4())
    
    db = get_db()
    db.unlearning_jobs.insert_one({
        "job_id": job_id,
        "status": "processing",
        "epochs": epochs,
        "lambda": lam,
        "temperature": temperature,
        "created_time": datetime.utcnow(),
        "finished_time": None,
        "model_path": None,
        "metrics": []
    })
    
    # Trigger Celery Task
    from tasks import unlearn_task
    unlearn_task.delay(job_id, epochs, lam, temperature)
    
    return jsonify({
        "job_id": job_id,
        "status": "processing",
        "message": "Unlearning task started in background."
    })

@unlearn_bp.route("/status/<job_id>", methods=["GET"])
def unlearn_status(job_id):
    db = get_db()
    job = db.unlearning_jobs.find_one({"job_id": job_id}, {"_id": 0})
    
    if not job:
        return jsonify({"error": "Job not found"}), 404
        
    return jsonify(job)
