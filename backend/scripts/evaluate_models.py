import os
import sys
import torch
import torch.nn as nn
from datetime import datetime
import numpy as np

# Add parent directory to path to import backend modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from db import get_db
from ml_core.models import get_arch, ModelLoader, DEVICE
from ml_core.dataset_loader import DatasetBuilder
import tasks

def evaluate_and_update():
    db = get_db()
    print("--- REAL MODEL EVALUATION SCRIPT ---")
    print(f"Device: {DEVICE}")
    
    # 1. Load Validation Data
    print("Loading actual validation dataset from MongoDB...")
    _, val_loader = DatasetBuilder.get_loaders(batch_size=32, include_noise=False)
    
    if val_loader is None or len(val_loader) == 0:
        print("ERROR: Validation dataset is empty. Cannot evaluate models.")
        return

    # 2. Define Architecture Mapping
    # Based on filename conventions in backend/model/
    ARCH_MAP = {
        "m1_resnet.pth": "resnet50",
        "m2_eff.pth": "efficientnet_b0",
        "m3_dense.pth": "densenet121",
        "m4_mobile.pth": "mobilenet_v2",
        "m5_vit.pth": "vit_b_16",
        "m6_convnext_b.pth": "convnext_base",
        "m7_swin_v2_b.pth": "swin_v2_b",
        "m8_effnet_v2_m.pth": "efficientnet_v2_m",
        "retrain.pth": "resnet50",
        "unlearning.pth": "resnet50",
        "base-unlearn.pth": "resnet50"
    }

    model_dir = os.path.join(backend_dir, "model")
    if not os.path.exists(model_dir):
        print(f"ERROR: Model directory not found at {model_dir}")
        return

    # 3. Iterate through all .pth files
    pth_files = [f for f in os.listdir(model_dir) if f.endswith(".pth")]
    print(f"Found {len(pth_files)} model files: {pth_files}")

    for filename in pth_files:
        print(f"\n>>> Evaluating: {filename}")
        
        # Determine architecture
        arch = ARCH_MAP.get(filename)
        if not arch:
            # Fallback to resnet50 if unknown? 
            # Or skip? User said "Không bỏ qua model nào"
            # I'll default to resnet50 but log a warning
            print(f"WARNING: Unknown architecture for {filename}. Defaulting to resnet50.")
            arch = "resnet50"
            
        weight_path = os.path.join(model_dir, filename)
        
        try:
            # 1. Load state_dict first to detect num_classes
            state_dict = torch.load(weight_path, map_location=DEVICE)
            if 'model_state_dict' in state_dict:
                state_dict = state_dict['model_state_dict']
            
            # Detect head size (e.g. classifier.weight, fc.weight, heads.head.weight)
            detected_classes = 27 # Baseline
            for key in ["fc.weight", "classifier.2.weight", "classifier.1.weight", "heads.head.weight", "head.weight", "classifier.weight"]:
                # Check for module. prefix too
                for k in [key, "module." + key]:
                    if k in state_dict:
                        detected_classes = state_dict[k].shape[0]
                        break
                if detected_classes != 27: break
            
            # 2. Init Model with DETECTED classes (to match weights exactly)
            print(f"Detected {detected_classes} classes from checkpoint. Dataset has {len(val_loader.dataset.classes)} labels.")
            print(f"Loading {arch} architecture for {detected_classes} classes...")
            model = get_arch(arch, num_classes=detected_classes)
            ModelLoader.load_model(model, weight_path, device=DEVICE)
            
            # Note: tasks.evaluate_model will automatically SKIP labels >= detected_classes
            
            # Real Evaluation
            print("Running evaluation on validation set...")
            metrics = tasks.evaluate_model(model, val_loader, DEVICE)
            
            # Print metrics
            print(f"RESULTS: Acc: {metrics['accuracy']}% | F1: {metrics['f1']} | Loss: {metrics['loss']}")
            
            # 4. Update Database (collection: model)
            # Use filename as unique identifier
            update_data = {
                "$set": {
                    "metrics": {
                        "accuracy": metrics["accuracy"],
                        "precision": metrics["precision"],
                        "recall": metrics["recall"],
                        "f1_score": metrics["f1"], # User asked for f1-score
                        "loss": metrics["loss"],
                        "evaluated_at": datetime.utcnow()
                    },
                    "last_updated": datetime.utcnow()
                }
            }
            
            # Update the 'model' collection
            result = db.model.update_one({"filename": filename}, update_data, upsert=True)
            
            if result.matched_count > 0:
                print(f"Successfully updated metrics for {filename} in 'model' collection.")
            else:
                print(f"Created new document for {filename} in 'model' collection with metrics.")
                # If it was a new document, maybe add the 'name' field too
                db.model.update_one({"filename": filename}, {"$set": {"name": filename.replace(".pth", "")}})

        except Exception as e:
            print(f"FAILED to evaluate {filename}: {str(e)}")
            import traceback
            traceback.print_exc()

    print("\n--- All models evaluated and database updated ---")

if __name__ == "__main__":
    evaluate_and_update()
