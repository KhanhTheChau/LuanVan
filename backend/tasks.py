from app import celery_app
from db import get_db
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from datetime import datetime
import os

from ml_core.dataset_loader import DatasetBuilder
from ml_core.models import get_arch, ModelLoader, DEVICE
from ml_core.unlearning import run_kd_unlearning

@celery_app.task(bind=True)
def unlearn_task(self, job_id, epochs, lam, temperature):
    db = get_db()
    
    try:
        print(f"Starting unlearning job {job_id} on {DEVICE}...")
        
        # 1. Initialize DataLoader
        clean_loader, val_loader = DatasetBuilder.get_loaders(batch_size=32, img_size=224)
        
        num_classes = 27 # Or derived dynamically
        
        # 2. Init Teacher Model
        teacher_model = get_arch("convnext_base", num_classes=num_classes)
        teacher_path = os.environ.get("TEACHER_MODEL_PATH", "checkpoints/teacher_model.pth")
        if os.path.exists(teacher_path):
            ModelLoader.load_model(teacher_model, teacher_path)
        
        # 3. Init Student Model
        student_model = get_arch("resnet50", num_classes=num_classes)
        student_path = os.environ.get("STUDENT_MODEL_PATH", "checkpoints/student_model.pth")
        if os.path.exists(student_path):
            ModelLoader.load_model(student_model, student_path)

        # 4. Run Unlearning KD Loop
        for metrics in run_kd_unlearning(
            teacher_model=teacher_model,
            student_model=student_model,
            clean_loader=clean_loader,
            val_loader=val_loader,
            epochs=epochs,
            lambda_val=lam,
            temperature=temperature,
            device=DEVICE
        ):
            # Real-time Update per Epoch
            print(f"Job {job_id} - Epoch {metrics['epoch']} - Total Loss: {metrics['total_loss']}")
            db.unlearning_jobs.update_one(
                {"job_id": job_id},
                {"$push": {"metrics": metrics}}
            )
            
        # 5. Save unlearned Model
        save_dir = "checkpoints"
        os.makedirs(save_dir, exist_ok=True)
        saved_model_path = os.path.join(save_dir, f"student_unlearned_{job_id[:8]}.pth")
        torch.save(student_model.state_dict(), saved_model_path)
            
        # 6. Completion Record
        db.unlearning_jobs.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow(),
                    "saved_weights_path": saved_model_path
                }
            }
        )
        return {"job_id": job_id, "status": "completed"}
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Job {job_id} Failed! {error_trace}")
        
        # Record Error
        db.unlearning_jobs.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": "failed",
                    "error_message": str(e),
                    "completed_at": datetime.utcnow()
                }
            }
        )
        raise e

@celery_app.task(bind=True)
def analyze_dataset_task(self, limit=None):
    from db import get_db
    import random
    
    db = get_db()
    
    # Optional limiting
    query = {}
    cursor = db.images.find(query)
    if limit is not None:
        cursor = cursor.limit(int(limit))
    
    analyzed_count = 0
    noisy_count = 0
    now = datetime.utcnow()
    
    for doc in cursor:
        doc_id = doc["_id"]
        
        # Load image (mocking the prediction logic below)
        # For a full pipeline, we'd load doc["image_data"], convert to tensor, run V1-V5 models
        
        # IMPLEMENTATION: Heuristic votes for demonstration
        v1_cam = random.uniform(0.5, 1.0)
        v2_crop = random.uniform(0.5, 1.0)
        v3_loss = random.uniform(0.5, 1.0)
        v4_tta = random.uniform(0.5, 1.0)
        v5_ens = random.uniform(0.5, 1.0)
        
        total_score = (v1_cam + v2_crop + v3_loss + v4_tta + v5_ens) / 5.0
        
        # Spec 02 says: Nếu `total_score` vượt ngưỡng nhiễu → `is_noisy = true`
        is_noisy = True if total_score >= 0.75 else False
        
        vote_scores = {
            "v1_cam": round(v1_cam, 4),
            "v2_crop": round(v2_crop, 4),
            "v3_loss": round(v3_loss, 4),
            "v4_tta": round(v4_tta, 4),
            "v5_ens": round(v5_ens, 4),
            "total_score": round(total_score, 4)
        }
        
        db.images.update_one(
            {"_id": doc_id},
            {
                "$set": {
                    "vote_scores": vote_scores,
                    "total_score": vote_scores["total_score"],
                    "is_noisy": is_noisy,
                    "analyzed_time": now,
                    "updated_at": now
                }
            }
        )
        
        analyzed_count += 1
        if is_noisy:
            noisy_count += 1
            
    return {
        "status": "completed",
        "analyzed_count": analyzed_count,
        "noisy_count": noisy_count
    }
