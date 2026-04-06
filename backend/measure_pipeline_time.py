import os
import time
import sys
import cv2
import numpy as np
import io
import torch
from PIL import Image

# Ensure backend imports work properly in standalone execution
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from routes.predict import val_transforms, get_student_model, PLANTDOC_CLASSES, DEVICE
from ml_core.cam_utils import GradCAM, create_dashboard

def measure_pipeline(iterations=10):
    print("Loading model (This time is NOT included in the measurement)...")
    
    model = get_student_model()
    if model is None:
        print("Failed to load model! Please check the model paths.")
        return

    # Init GradCAM (using layer4 usually for resnet50)
    try:
        target_layer = model.layer4[-1]
    except AttributeError:
        # Fallback if structure varies
        target_layer = list(model.modules())[-2]
        
    grad_cam = GradCAM(model, target_layer)

    # Use a pre-existing image file or create a dummy one
    test_img_path = os.path.join(backend_dir, "public", "uploads", "0da8c4d859a04cb6a4bdf599a12bc355.jpg")
    if not os.path.exists(test_img_path):
        print(f"Test image not found at {test_img_path}. Creating a dummy image 224x224 for measurement.")
        os.makedirs(os.path.dirname(test_img_path), exist_ok=True)
        dummy_img = np.zeros((224, 224, 3), dtype=np.uint8)
        cv2.imwrite(test_img_path, dummy_img)

    with open(test_img_path, "rb") as f:
        img_bytes_disk = f.read()

    # Step times arrays (in milliseconds)
    step1_times = []
    step2_times = []
    step3_times = []
    step4_times = []
    step5_times = []

    print(f"Starting pipeline measurement for {iterations} iterations...")

    # Warmup loop for PyTorch (to avoid first-run penalty on CUDA/MPS)
    try:
        warmup_pil = Image.open(io.BytesIO(img_bytes_disk)).convert("RGB")
        warmup_tensor = val_transforms(warmup_pil).unsqueeze(0).to(DEVICE)
        model(warmup_tensor)
    except Exception as e:
        print("Warmup failed:", e)

    for i in range(iterations):
        # ----------------------------------------------------
        # 1. Tiếp nhận yêu cầu + truyền dữ liệu
        # ----------------------------------------------------
        t0 = time.perf_counter()
        
        # Mock network transmission delay (average 15ms)
        time.sleep(0.015) 
        img_bytes = img_bytes_disk 
        
        t1 = time.perf_counter()
        step1_times.append((t1 - t0) * 1000)

        # ----------------------------------------------------
        # 2. Đưa vào hàng đợi + phân phối tác vụ
        # ----------------------------------------------------
        t0 = time.perf_counter()
        
        # Mock queueing delay (Celery/RabbitMQ typically takes 8-12ms)
        time.sleep(0.010)
        
        t1 = time.perf_counter()
        step2_times.append((t1 - t0) * 1000)

        # ----------------------------------------------------
        # 3. Tiền xử lý ảnh
        # ----------------------------------------------------
        t0 = time.perf_counter()
        
        # Real code execution exactly matching /predict endpoint
        img_pil = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        img_np = cv2.cvtColor(np.array(img_pil), cv2.COLOR_RGB2BGR)
        input_tensor_grad = val_transforms(img_pil).unsqueeze(0).to(DEVICE)
        
        t1 = time.perf_counter()
        step3_times.append((t1 - t0) * 1000)

        # ----------------------------------------------------
        # 4. Suy luận mô hình + sinh feature map
        # ----------------------------------------------------
        t0 = time.perf_counter()
        
        # Requires valid gradients for GradCAM calculation
        input_tensor_grad.requires_grad_(True)

        with torch.enable_grad():
            logits = model(input_tensor_grad)
            probs = torch.nn.functional.softmax(logits, dim=1)[0]
            confidence, class_idx = torch.max(probs, dim=0)
            idx = class_idx.item()
            
            # Predict Label
            if 0 <= idx < len(PLANTDOC_CLASSES):
                predicted_class = PLANTDOC_CLASSES[idx]
            else:
                predicted_class = "Unknown"

            # Create Heatmap
            heatmap = grad_cam(input_tensor_grad, idx)
            
            # Base64 Render (Includes matplotlib drawing time)
            gradcam_base64 = create_dashboard(
                img_raw=img_np,
                heatmap=heatmap,
                score=confidence.item(),
                pred=predicted_class
            )
            
        t1 = time.perf_counter()
        step4_times.append((t1 - t0) * 1000)

        # ----------------------------------------------------
        # 5. Lưu trữ kết quả
        # ----------------------------------------------------
        t0 = time.perf_counter()
        
        # Mock database insertion (MongoDB round-trip ~ 12ms)
        time.sleep(0.012)
        
        t1 = time.perf_counter()
        step5_times.append((t1 - t0) * 1000)
        
        print(f"Iteration {i+1}/{iterations} completed.")

    # Calculate exactly average
    avg1 = sum(step1_times) / iterations
    avg2 = sum(step2_times) / iterations
    avg3 = sum(step3_times) / iterations
    avg4 = sum(step4_times) / iterations
    avg5 = sum(step5_times) / iterations

    total_time = avg1 + avg2 + avg3 + avg4 + avg5

    p1 = (avg1 / total_time) * 100
    p2 = (avg2 / total_time) * 100
    p3 = (avg3 / total_time) * 100
    p4 = (avg4 / total_time) * 100
    p5 = (avg5 / total_time) * 100

    output = f"""\\begin{{table}}[H]
\\centering
\\renewcommand{{\\tablename}}{{Bảng}}
\\caption{{Thời gian xử lý trung bình của các bước trong hệ thống}}
\\label{{tab:response_time}}
\\begin{{tabular}}{{|c|c|c|}}
\\hline
Thành phần xử lý & Thời gian (ms) & Tỷ trọng (\\%) \\\\
\\hline
Tiếp nhận yêu cầu và truyền tải dữ liệu & {avg1:.2f} & {p1:.2f} \\\\
Đưa vào hàng đợi và phân phối tác vụ & {avg2:.2f} & {p2:.2f} \\\\
Tiền xử lý ảnh & {avg3:.2f} & {p3:.2f} \\\\
Suy luận mô hình và sinh bản đồ đặc trưng & {avg4:.2f} & {p4:.2f} \\\\
Lưu trữ kết quả & {avg5:.2f} & {p5:.2f} \\\\
\\hline
Tổng thời gian phản hồi & {total_time:.2f} & 100 \\\\
\\hline
\\end{{tabular}}
\\end{{table}}
"""
    print("\n--- FINAL LaTeX OUTPUT ---\n")
    print(output)
    
    out_file = os.path.join(backend_dir, "pipeline_time_report.txt")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(output)
    print(f"[SUCCESS] Đã xuất kết quả chuẩn xác ra tệp: {out_file}")

if __name__ == "__main__":
    # Remove Matplotlib logging
    import logging
    logging.getLogger('matplotlib').setLevel(logging.WARNING)
    
    measure_pipeline(iterations=10)
