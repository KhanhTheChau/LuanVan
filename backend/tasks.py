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
                    "finished_time": datetime.utcnow(),
                    "model_path": saved_model_path
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
                    "finished_time": datetime.utcnow()
                }
            }
        )
        raise e

@celery_app.task(bind=True)
def analyze_dataset_task(self, limit=None):
    # This task runs Supreme Oracle Pipeline
    # TODO: Needs actual V1-V5 ensemble models implementation if needed.
    # We update images to is_noisy=True if total_score > threshold
    return {"status": "analyzed"}
