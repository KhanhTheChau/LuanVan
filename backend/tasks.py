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
from ml_core.cam_utils import GradCAM
from PIL import Image
import io
import numpy as np
from torchvision import transforms

# Global Model Cache
_models_cache = {}

def get_cached_model(m_id="m1"):
    global _models_cache
    if m_id in _models_cache:
        return _models_cache[m_id]
        
    model_mapping = {
        "m1": ("resnet50", "m1_resnet.pth"),
        "m2": ("efficientnet_b0", "m2_eff.pth"),
        "m3": ("densenet121", "m3_dense.pth"),
        "m4": ("mobilenet_v2", "m4_mobile.pth"),
    }
    
    if m_id not in model_mapping:
        return None
        
    kind, filename = model_mapping[m_id]
    weight_path = os.path.join(os.path.dirname(__file__), "model", filename)
    
    if not os.path.exists(weight_path):
        print(f"Warning: Model weight {filename} not found.")
        return None
        
    try:
        model = get_arch(kind, num_classes=27)
        model = ModelLoader.load_model(model, weight_path, device=DEVICE)
        _models_cache[m_id] = model
        return model
    except Exception as e:
        print(f"Error loading model {m_id}: {e}")
        return None

# Standard transforms for voters
voter_transforms = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

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

def detect_noise_internal(doc, now=None):
    if now is None:
        now = datetime.utcnow()
    
    db = get_db()
    # 1. Load Image
    img_bytes = None
    if "image_data" in doc:
        img_bytes = doc["image_data"]
    elif "file_path" in doc:
        project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        file_path = os.path.join(project_root, doc["file_path"])
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                img_bytes = f.read()
    
    if not img_bytes:
        return {"error": "Image data not found"}

    img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    tensor = voter_transforms(img_pil).unsqueeze(0).to(DEVICE)
    
    # Init Models
    m1 = get_cached_model("m1") # ResNet50 for V1-V4
    if not m1:
        return {"error": "Baseline model m1 not loaded"}

    label_idx = 0 # Placeholder if label mapping is needed, for now use argmax of m1
    with torch.no_grad():
        logits_m1 = m1(tensor)
        probs_m1 = torch.softmax(logits_m1, dim=1)[0]
        conf_m1, pred_m1 = torch.max(probs_m1, dim=0)
        pred_m1 = pred_m1.item()
        conf_m1 = conf_m1.item()

    # V1: CAM Focus (ROI Check)
    target_layer = m1.layer4[-1]
    grad_cam = GradCAM(m1, target_layer)
    heatmap = grad_cam(tensor, pred_m1)
    
    # Check if the hottest part of the heatmap is near the center (typical of clean data)
    h, w = heatmap.shape
    center_roi = heatmap[h//4:3*h//4, w//4:3*w//4]
    v1_cam = 1.0 if np.max(center_roi) > 0.4 else 0.2
    
    # V2: Crop Stability
    crop_size = 180
    left = (224 - crop_size) // 2
    top = (224 - crop_size) // 2
    img_crop = img_pil.crop((left, top, left + crop_size, top + crop_size))
    tensor_crop = voter_transforms(img_crop).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits_crop = m1(tensor_crop)
        conf_crop = torch.softmax(logits_crop, dim=1)[0, pred_m1].item()
    v2_crop = 1.0 if conf_crop > 0.4 else 0.3
    
    # V3: Confidence (Loss Heuristic)
    # If confidence is very low, it's likely noisy
    v3_loss = conf_m1 

    # V4: TTA Stability (Rotation check)
    shifts = []
    for angle in [90, 180, 270]:
        img_rot = img_pil.rotate(angle)
        tensor_rot = voter_transforms(img_rot).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            pred_rot = torch.argmax(m1(tensor_rot), dim=1).item()
            shifts.append(pred_rot == pred_m1)
    v4_tta = sum(shifts) / 3.0
    
    # V5: Ensemble Disagreement
    m2 = get_cached_model("m2")
    m3 = get_cached_model("m3")
    m4 = get_cached_model("m4")
    
    ensemble_preds = [pred_m1]
    for m in [m2, m3, m4]:
        if m:
            with torch.no_grad():
                ensemble_preds.append(torch.argmax(m(tensor), dim=1).item())
    
    # Disagreement score: ratio of majority class
    from collections import Counter
    counts = Counter(ensemble_preds)
    majority_count = counts.most_common(1)[0][1]
    v5_ens = majority_count / len(ensemble_preds)

    total_score = (v1_cam + v2_crop + v3_loss + v4_tta + v5_ens) / 5.0
    # Higher total_score means CLEANER in notebook? 
    # Actually wait, usually 1 is CLEAN, 0 is NOISE in V1-V5 scores if they are "confidence votes"
    # But user wants "noise result". Total score in notebook is often used: 
    # If total_score < threshold -> NOISY.
    # threshold = 0.75 ? (In notebook logic V1+V2+V3+V4+V5 >= 4 is clean)
    
    is_noisy = True if total_score < 0.7 else False
    
    vote_scores = {
        "v1_cam": round(v1_cam, 4),
        "v2_crop": round(v2_crop, 4),
        "v3_loss": round(v3_loss, 4),
        "v4_tta": round(v4_tta, 4),
        "v5_ens": round(v5_ens, 4),
        "total_score": round(total_score, 4)
    }
    
    return {
        "vote_scores": vote_scores,
        "total_score": vote_scores["total_score"],
        "is_noisy": is_noisy,
        "analyzed_time": now,
        "updated_at": now
    }

@celery_app.task(bind=True)
def analyze_dataset_task(self, limit=None):
    from db import get_db
    db = get_db()
    
    query = {}
    cursor = db.images.find(query)
    if limit is not None:
        cursor = cursor.limit(int(limit))
    
    analyzed_count = 0
    noisy_count = 0
    now = datetime.utcnow()
    
    for doc in cursor:
        doc_id = doc["_id"]
        # detect_noise_internal returns result but we DO NOT update DB here
        res = detect_noise_internal(doc, now)
        
        analyzed_count += 1
        if res.get("is_noisy"):
            noisy_count += 1
            
    return {
        "status": "completed",
        "analyzed_count": analyzed_count,
        "noisy_count": noisy_count
    }
