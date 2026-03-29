import os
import sys
from datetime import datetime
from db import get_db
from scripts.import_dataset import import_dataset

def run_auto_seed():
    print("--- Starting Auto Seed Check ---")
    db = get_db()
    
    # 1. Seed Models
    if "models" not in db.list_collection_names():
        db.create_collection("models")
    
    model_count = db.models.count_documents({})
    if model_count == 0:
        print("Auto Seed: Inserting default models...")
        model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "model"))
        if os.path.exists(model_dir):
            models_to_insert = []
            for filename in os.listdir(model_dir):
                if filename.endswith(".pth"):
                    models_to_insert.append({
                        "filename": filename,
                        "name": filename.replace(".pth", ""),
                        "created_at": datetime.utcnow()
                    })
            if models_to_insert:
                db.models.insert_many(models_to_insert)
                print(f"Auto Seed: Inserted {len(models_to_insert)} models into DB.")
        else:
            print("Auto Seed: Error - Model directory not found at", model_dir)
    else:
        print(f"Auto Seed: Models collection already has {model_count} records.")
            
    # 2. Seed Dataset
    images_count = db.images.count_documents({})
    if images_count == 0:
        print("Auto Seed: Dataset is empty. Running import_dataset script...")
        # Since import_dataset defaults to 'plantdoc2', we need to pass absolute path if needed
        # Assuming the working directory is the root of the project when running app.py
        import_dataset()
    else:
        print(f"Auto Seed: Dataset already has {images_count} images.")
        
    # 3. Ensure Experiments collection
    if "experiments" not in db.list_collection_names():
        db.create_collection("experiments")
        
    if "training_logs" not in db.list_collection_names():
        db.create_collection("training_logs")
        
    print("--- Auto Seed Check Complete ---")

if __name__ == "__main__":
    run_auto_seed()
