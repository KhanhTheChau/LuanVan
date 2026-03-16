import os
from flask import Blueprint, request, jsonify
import base64
import cv2
import numpy as np
from PIL import Image
import io
import torch
from torchvision import transforms

from ml_core.models import get_arch, ModelLoader, DEVICE
from ml_core.cam_utils import GradCAM, create_dashboard

predict_bp = Blueprint("predict", __name__)

# Lazy load the student model once when needed or globally
_student_model = None

def get_student_model():
    global _student_model
    if _student_model is None:
        try:
            _student_model = get_arch("resnet50")
            # Using placeholder path, will need proper config later
            weight_path = os.environ.get("STUDENT_MODEL_PATH", "checkpoints/student_model.pth")
            if os.path.exists(weight_path):
                ModelLoader.load_model(_student_model, weight_path)
        except Exception as e:
            print("Model load warning:", e)
    return _student_model

# Standard transforms
val_transforms = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
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
        
        # 2. Convert to tensor
        input_tensor = val_transforms(img_pil).unsqueeze(0).to(DEVICE)
        
        # 3. Run ml_core models prediction
        model = get_student_model()
        if model is None:
            return jsonify({"error": "Model not loaded"}), 500
            
        with torch.no_grad():
            logits = model(input_tensor)
            
        # 4. Apply softmax
        probs = torch.nn.functional.softmax(logits, dim=1)[0]
        confidence, class_idx = torch.max(probs, dim=0)
        
        # Mapping index to class placeholder
        predicted_class = f"Class_{class_idx.item()}"
        
        # 5. Generate Grad-CAM
        # Get target layer for resnet50 (layer4.2.conv3)
        target_layer = list(model.layer4.modules())[-1]
        grad_cam = GradCAM(model, target_layer)
        heatmap = grad_cam(input_tensor, class_idx.item())
        
        # 6. Overlay on original image and Base64 Encode
        gradcam_base64 = create_dashboard(
            img_raw=img_np,
            heatmap=heatmap,
            score=confidence.item(),
            pred=predicted_class
        )
        
        time_taken = time.time() - start_t
        
        return jsonify({
            "predicted_class": predicted_class,
            "confidence": float(confidence.item()),
            "processing_time": float(time_taken),
            "gradcam_base64": gradcam_base64
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
         
    target_layer = list(model.layer4.modules())[-1]
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
            
            heatmap = grad_cam(input_tensor, class_idx.item())
            predicted_class = f"Class_{class_idx.item()}"
            
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
            results.append({
                "filename": file.filename,
                "error": str(e)
            })
        
    return jsonify({
        "total_processed": len(results),
        "results": results
    })
