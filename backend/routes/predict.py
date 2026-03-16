import os
from flask import Blueprint, request, jsonify
import base64
import cv2
import numpy as np
from PIL import Image
import io
import torch
from torchvision import transforms
import uuid
from datetime import datetime

from ml_core.models import get_arch, ModelLoader, DEVICE
from ml_core.cam_utils import GradCAM, create_dashboard

predict_bp = Blueprint("predict", __name__)

# System Spec: Model path for m1
DEFAULT_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "model", "m1_resnet.pth")

# 27 Classes in PlantDoc Dataset
PLANTDOC_CLASSES = [
    'Apple Scab Leaf', 'Apple leaf', 'Apple rust leaf', 'Bell_pepper leaf', 'Bell_pepper leaf spot',
    'Blueberry leaf', 'Cherry leaf', 'Corn Gray leaf spot', 'Corn leaf blight', 'Corn rust leaf',
    'Peach leaf', 'Potato leaf early blight', 'Potato leaf late blight', 'Raspberry leaf',
    'Soyabean leaf', 'Squash Powdery mildew leaf', 'Strawberry leaf', 'Tomato Early blight leaf',
    'Tomato Septoria leaf spot', 'Tomato leaf', 'Tomato leaf bacterial spot', 'Tomato leaf late blight',
    'Tomato leaf mosaic virus', 'Tomato leaf yellow virus', 'Tomato mold leaf', 'grape leaf', 
    'grape leaf black rot'
]

# Load model 1 lần khi backend start (Lỗi 5)
_student_model = None

def get_student_model():
    global _student_model
    if _student_model is None:
        try:
            print("--- INITIALIZING MODEL ---")
            weight_path = os.environ.get("STUDENT_MODEL_PATH", DEFAULT_MODEL_PATH)
            
            # Lỗi 1: Sai đường dẫn / debug log
            print("MODEL PATH:", weight_path)
            print("MODEL EXISTS:", os.path.exists(weight_path))
            
            if not os.path.exists(weight_path):
                print(f"Error: Model file not found at {weight_path}")
                return None
                
            # Khởi tạo kiến trúc
            _student_model = get_arch("resnet50", num_classes=27)  # PlantDoc 27 classes
            
            # Gọi load_model chuẩn hóa
            _student_model = ModelLoader.load_model(_student_model, weight_path, device=DEVICE)
            print("--- MODEL LOADED SUCCESSFULLY ---")
            
        except Exception as e:
            print("Model load error:", e)
            _student_model = None
            
    return _student_model

# Standard transforms (Chuẩn ResNet/ImageNet - Lỗi 4)
val_transforms = transforms.Compose([
    transforms.Resize(224),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

@predict_bp.route("/predict", methods=["POST"])
def predict_single():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
        
    img_bytes = file.read()
    if len(img_bytes) > 5 * 1024 * 1024:
        return jsonify({"error": "Image max size is 5MB"}), 400
        
    import time
    start_t = time.time()
    
    try:
        # 1. Decode bytes to numpy img & PIL
        img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_np = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
        
        # Save image to public/uploads
        upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        random_filename = f"{uuid.uuid4().hex}.jpg"
        img_path = os.path.join(upload_dir, random_filename)
        img_pil.save(img_path)
        
        # 2. Convert to tensor
        input_tensor = val_transforms(img_pil).unsqueeze(0).to(DEVICE)
        
        # 3. Request Model (loaded globally)
        model = get_student_model()
        if model is None:
            return jsonify({"error": "Model not loaded. Please check backend/model/ path."}), 500
            
        # 4. Predict
        # Đã gọi eval() từ ModelLoader, dùng torch.no_grad()
        with torch.no_grad():
            logits = model(input_tensor)
            
        # 5. Calculate probabilities
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
        confidence, class_idx = torch.max(probs, dim=0)
        
        idx = class_idx.item()
        print("Predicted class id:", idx)
        
        # Mạch lấy Label qua List Mappings
        if 0 <= idx < len(PLANTDOC_CLASSES):
            predicted_class = PLANTDOC_CLASSES[idx]
        else:
            predicted_class = "Unknown"
            
        # 6. Generate Grad-CAM (Requires grad)
        with torch.enable_grad():
            target_layer = model.layer4[-1]
            grad_cam = GradCAM(model, target_layer)
            # Khởi tạo lại tensor có require_grad để tính heatmap
            input_tensor_grad = val_transforms(img_pil).unsqueeze(0).to(DEVICE)
            input_tensor_grad.requires_grad_(True)
            heatmap = grad_cam(input_tensor_grad, class_idx.item())
        
        # 7. Render Base64 GradCAM
        gradcam_base64 = create_dashboard(
            img_raw=img_np,
            heatmap=heatmap,
            score=confidence.item(),
            pred=predicted_class
        )
        
        time_taken = time.time() - start_t
        
        # 8. Save to prediction history if User Token exists
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            from db import get_db
            db = get_db()
            session = db.sessions.find_one({"token": token})
            if session:
                user_id = session.get("user_id")
                db.prediction_history.insert_one({
                    "user_id": user_id,
                    "image_path": f"/public/uploads/{random_filename}",
                    "predicted_label": predicted_class,
                    "confidence": float(confidence.item()),
                    "created_at": datetime.utcnow()
                })
        
        return jsonify({
            "predicted_class": predicted_class,
            "confidence": float(confidence.item()),
            "processing_time": float(time_taken),
            "gradcam_base64": gradcam_base64
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "traceback": traceback.format_exc()}), 500

@predict_bp.route("/predict/batch", methods=["POST"])
def predict_batch():
    files = request.files.getlist("images[]")
    if not files and "zip_file" not in request.files:
        return jsonify({"error": "No images[] or zip_file provided"}), 400
    
    if len(files) > 100:
        return jsonify({"error": "Max 100 images per request allowed"}), 400

    results = []
    
    model = get_student_model()
    if model is None:
         return jsonify({"error": "Model not loaded"}), 500
         
    target_layer = model.layer4[-1]
    grad_cam = GradCAM(model, target_layer)

    for file in files:
        if file.filename == "":
            continue
            
        img_bytes = file.read()
        if len(img_bytes) > 5 * 1024 * 1024:
            results.append({
                "filename": file.filename,
                "error": "Exceeds 5MB limit"
            })
            continue
            
        try:
            img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            img_np = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
            input_tensor = val_transforms(img_pil).unsqueeze(0).to(DEVICE)
            
            # Since GradCAM requires gradients, enable locally
            logits = model(input_tensor)
            probs = torch.nn.functional.softmax(logits, dim=1)[0]
            confidence, class_idx = torch.max(probs, dim=0)
            
            idx = class_idx.item()
            print("Predicted class id:", idx)
            
            heatmap = grad_cam(input_tensor, idx)
            
            if 0 <= idx < len(PLANTDOC_CLASSES):
                predicted_class = PLANTDOC_CLASSES[idx]
            else:
                predicted_class = "Unknown"
            
            gradcam_base64 = create_dashboard(
                img_raw=img_np,
                heatmap=heatmap,
                score=confidence.item(),
                pred=predicted_class
            )
            
            results.append({
                "filename": file.filename,
                "predicted_class": predicted_class,
                "confidence": float(confidence.item()),
                "gradcam_base64": gradcam_base64
            })
        except Exception as e:
            import traceback
            traceback.print_exc()
            results.append({
                "filename": file.filename,
                "error": str(e),
                "traceback": traceback.format_exc()
            })
        
    return jsonify({
        "total_processed": len(results),
        "results": results
    })
