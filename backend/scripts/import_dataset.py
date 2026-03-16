import os
import sys

# Force UTF-8 encoding for prints on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import json
from datetime import datetime
from pymongo import MongoClient

# Thêm parent path để có thể import từ backend config nếu cần
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def import_dataset(base_dir="plantdoc2"):
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
    db_name = os.environ.get("MONGO_DB_NAME", "plant_disease_db")
    
    print(f"Kết nối tới DB {mongo_uri} / {db_name}...")
    client = MongoClient(mongo_uri)
    db = client[db_name]
    
    print(f"Quét thư mục dataset: {base_dir}")
    if not os.path.exists(base_dir):
        print(f"Thư mục {base_dir} không tồn tại. Vui lòng kiểm tra lại.")
        return
        
    splits = ["train", "val", "test"]
    added_count = 0
    now = datetime.utcnow()
    
    for split in splits:
        img_dir = os.path.join(base_dir, split, "img")
        ann_dir = os.path.join(base_dir, split, "ann")
        
        if not os.path.exists(img_dir):
            continue
            
        print(f"Đang import thư mục split: {split}...")
        for filename in os.listdir(img_dir):
            if filename.startswith("."):
                continue
                
            img_path = os.path.join(img_dir, filename)
            if not os.path.isfile(img_path):
                continue
                
            # Bỏ qua lưu binary vào database, chỉ giữ lại file path
            # with open(img_path, "rb") as f:
            #     img_bytes = f.read()
                
            # Đọc file annotation JSON tương ứng nếu có
            ann_file = os.path.join(ann_dir, f"{filename}.json")
            
            metadata = {}
            target_label = "Unknown"
            
            if os.path.exists(ann_file):
                try:
                    with open(ann_file, "r", encoding="utf-8") as f:
                        meta_data_json = json.load(f)
                        metadata = meta_data_json
                        
                        # Dữ liệu PlantDoc lưu annotation dưới dạng mảng objects
                        objects = meta_data_json.get("objects", [])
                        if objects and isinstance(objects, list) and len(objects) > 0:
                            target_label = objects[0].get("classTitle", "Unknown")
                        else:
                            # Fallback nếu mảng annotation trống
                            target_label = "Unclassified"
                            
                except Exception as e:
                    print(f"Lỗi đọc ann file {ann_file}: {e}")
            
            # Document structure: (bỏ image_data nhị phân)
            doc = {
                "dataset_name": os.path.basename(base_dir),
                "file_path": f"{base_dir}/{split}/img/{filename}",
                "filename": filename,
                "data_split": split,
                "label": target_label,
                "predict_label": "",
                "vote_scores": {},
                "is_noisy": False,
                "status": "pending",
                "metadata": metadata,
                "created_at": now,
                "updated_at": now
            }
            db.images.insert_one(doc)
            added_count += 1
            
            if added_count % 100 == 0:
                print(f"Đã import {added_count} ảnh...")
                
    print(f"Hoàn thành vòng lặp import {added_count} ảnh vào DB.")
    
    # Chia dữ liệu train thành 80% train và 20% val
    print("Tiến hành chạy DB để chia dữ liệu train thành 80/20 (train/val)...")
    import random
    
    # Lấy danh sách các label trong tập 'train'
    labels = db.images.distinct("label", {"data_split": "train"})
    val_converted_count = 0
    
    for lbl in labels:
        # Lấy tất cả _id của ảnh thuộc label này trong tập train
        train_docs = list(db.images.find({"data_split": "train", "label": lbl}, {"_id": 1}))
        if not train_docs:
            continue
            
        random.shuffle(train_docs)
        
        # Lấy 20% làm tập val
        num_val = int(len(train_docs) * 0.2)
        if num_val > 0:
            val_ids = [doc["_id"] for doc in train_docs[:num_val]]
            
            db.images.update_many(
                {"_id": {"$in": val_ids}},
                {"$set": {"data_split": "val"}}
            )
            val_converted_count += len(val_ids)
            
    print(f"Đã hoàn tất chia phân tập dữ liệu. Chuyển {val_converted_count} ảnh từ train sang val.")

if __name__ == "__main__":
    import_dataset()
