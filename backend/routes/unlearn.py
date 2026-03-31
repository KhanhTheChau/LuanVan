import uuid
from flask import Blueprint, request, jsonify
from datetime import datetime
from db import get_db
from routes.auth import require_admin

unlearn_bp = Blueprint("unlearn", __name__)

@unlearn_bp.route("/start", methods=["POST"])
@require_admin
def start_unlearning():
    job_id = str(uuid.uuid4())
    
    db = get_db()
    db.unlearning_jobs.insert_one({
        "job_id": job_id,
        "status": "pending",
        "model_architecture": "Multiple (Research)",
        "logs": [],
        "metrics": [],
        "comparison": [],
        "created_at": datetime.utcnow(),
        "completed_at": None
    })
    
    # Trigger Research Task (Evaluation of 3 models)
    from tasks import unlearn_research_task
    unlearn_research_task.delay(job_id)
    
    return jsonify({
        "job_id": job_id,
        "status": "pending",
        "message": "Research evaluation task started."
    })

@unlearn_bp.route("/status/<job_id>", methods=["GET"])
def unlearn_status(job_id):
    db = get_db()
    job = db.unlearning_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)

@unlearn_bp.route("/logs/<job_id>", methods=["GET"])
def get_job_logs(job_id):
    db = get_db()
    job = db.unlearning_jobs.find_one({"job_id": job_id}, {"logs": 1, "_id": 0})
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job.get("logs", []))

@unlearn_bp.route("/stats", methods=["GET"])
def get_unlearn_stats():
    db = get_db()
    total = db.images.count_documents({})
    noisy = db.images.count_documents({"is_noisy": True})
    return jsonify({
        "total_images": total,
        "noisy_images": noisy
    })

@unlearn_bp.route("/comparison", methods=["GET"])
def get_comparison():
    db = get_db()
    # 1. Fetch from 'models' collection (independent of unlearning jobs)
    model_cursor = db.models.find({}, {"_id": 0}).sort([("created_at", -1)])
    model_list = list(model_cursor)

    print(f"[BACKEND] Fetched {len(model_list)} records from 'models' collection.")

    if model_list:
        comparison_data = []
        mapping = {
            "Knowledge distillation (Improved)": "Improved",
            "resnet50_retrain": "Retrain",
            "resnet50": "Baseline"
        }
        
        descriptions = {
            "Knowledge distillation (Improved)": "Advanced selective forgetting with optimized knowledge distillation.",
            "resnet50_retrain": "Standard retrained model using baseline architecture.",
            "resnet50": "Initial pre-trained model before any unlearning process."
        }

        for model in model_list:
            name = model.get("model_name")
            frontend_name = mapping.get(name, name)
            
            comparison_data.append({
                "name": frontend_name,
                "accuracy": model.get("accuracy", 0.0),
                "f1": model.get("f1_1", 0.0),          # Updated to f1_1
                "precision": model.get("precision_1", 0.0), # Updated to precision_1
                "recall": model.get("recall_1", 0.0),       # Updated to recall_1
                "training_time": model.get("time", 0.0),    # Updated to time
                "memory_mb": model.get("memory_mb", 0.0),
                "description": descriptions.get(name, f"Evaluated model at epoch {model.get('epoch')}")
            })
        
        print(f"[BACKEND] Returning {len(comparison_data)} mapped comparison records.")
        # print(f"[DEBUG] Full payload: {comparison_data}") # Optional debug log
        return jsonify(comparison_data)

    # 2. Fallback check for unlearning_jobs
    job = db.unlearning_jobs.find_one(
        {"status": "completed", "comparison": {"$exists": True}},
        sort=[("completed_at", -1)]
    )
    if not job:
        print("[BACKEND] No data found in 'models' or 'unlearning_jobs'.")
        return jsonify([])
    
    print(f"[BACKEND] Fallback: Returning comparison from legacy job: {job.get('job_id')}")
    return jsonify(job.get("comparison", []))

    # 2. Fallback: Get from unlearning_jobs (legacy check)
    job = db.unlearning_jobs.find_one(
        {"status": "completed", "comparison": {"$exists": True}},
        sort=[("completed_at", -1)]
    )
    if not job:
        return jsonify([])
    return jsonify(job.get("comparison", []))
