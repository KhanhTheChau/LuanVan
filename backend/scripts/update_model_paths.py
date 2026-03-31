import os
import sys

# Add parent directory to path to import backend modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from db import get_db

# Configuration
MODEL_DIR = os.path.join(backend_dir, "model")

# Reverse mapping: model_name (from CSV/DB) -> physical filename (.pth)
MODEL_MAPPING = {
    "resnet50": "m1_resnet.pth",
    "efficientnet_b0": "m2_eff.pth",
    "densenet121": "m3_dense.pth",
    "mobilenet_v3": "m4_mobile.pth", # matching CSV name
    "vit_b_16": "m5_vit.pth",
    "convnext_base": "m6_convnext_b.pth",
    "swin_v2_b": "m7_swin_v2_b.pth",
    "effnet_v2_m": "m8_effnet_v2_m.pth",
    "resnet50_retrain": "retrain.pth",
    "Knowledge distillation": "base-unlearn.pth",
    "Knowledge distillation (Improved)": "unlearning.pth" # Mentioned as 'Improve' in request
}

def update_model_paths():
    """Updates the 'model_path' field in the 'models' collection based on 'model_name'."""
    print(f"\n--- STARTING MODEL PATH UPDATE ---")
    print(f"Model directory: {MODEL_DIR}\n")
    
    db = get_db()
    collection = db.models

    # Fetch all records
    try:
        records = list(collection.find())
        print(f"Found {len(records)} records to check.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to connect to database: {e}")
        return

    success_count = 0
    warning_count = 0
    error_count = 0

    for doc in records:
        model_name = doc.get("model_name")
        obj_id = doc.get("_id")
        
        if not model_name:
            print(f"ERROR: Record {obj_id} has no model_name. Skipping.")
            error_count += 1
            continue

        # 1. Resolve filename from mapping
        filename = MODEL_MAPPING.get(model_name)
        
        if not filename:
            print(f"WARNING: No mapping found for '{model_name}'. (ID: {obj_id})")
            warning_count += 1
            # Update path to None to ensure consistency or leave as is?
            # User said "Còn cái khác không có thì none"
            collection.update_one({"_id": obj_id}, {"$set": {"model_path": None}})
            continue

        # 2. Check if file exists in the directory
        full_path = os.path.join(MODEL_DIR, filename)
        
        if os.path.exists(full_path):
            try:
                # 3. Update database
                collection.update_one(
                    {"_id": obj_id}, 
                    {"$set": {"model_path": full_path}}
                )
                print(f"SUCCESS: Updated '{model_name}' -> {filename}")
                success_count += 1
            except Exception as e:
                print(f"ERROR: Failed to update record {obj_id}: {e}")
                error_count += 1
        else:
            print(f"WARNING: File {filename} not found at {MODEL_DIR} for model '{model_name}'")
            warning_count += 1
            collection.update_one({"_id": obj_id}, {"$set": {"model_path": None}})

    print("\n--- UPDATE SUMMARY ---")
    print(f"Total processed: {len(records)}")
    print(f"Successfully updated: {success_count}")
    print(f"Warnings (missing file/mapping): {warning_count}")
    print(f"Errors: {error_count}")
    print("----------------------\n")

if __name__ == "__main__":
    update_model_paths()
