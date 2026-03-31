import io
from PIL import Image
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from db import get_db

class MongoDataset(Dataset):
    def __init__(self, db, split="train", is_noisy=False, transform=None):
        self.db = db
        self.transform = transform
        
        # Load all metadata
        query = {"data_split": split}
        if is_noisy is not None:
            query["is_noisy"] = is_noisy
            
        # Only loading metadata initially to save RAM
        cursor = self.db.images.find(query, {"_id": 1, "label": 1})
        
        self.samples = list(cursor)
        
        # Mapping string labels to int
        all_labels = self.db.images.distinct("label")
        self.classes = sorted(all_labels)
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        sample_meta = self.samples[idx]
        doc_id = sample_meta["_id"]
        label_str = sample_meta["label"]
        label_idx = self.class_to_idx.get(label_str, 0) # Fallback to 0 if not found
        
        # Lazy load binary image data from DB
        doc = self.db.images.find_one({"_id": doc_id}, {"image_data": 1})
        if not doc or "image_data" not in doc:
            # Handle missing data: return black image
            img = Image.new('RGB', (224, 224), color = (0, 0, 0))
        else:
            img_bytes = doc["image_data"]
            # Convert bytes to PIL Image
            img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        if self.transform:
            img = self.transform(img)
            
        return img, label_idx

class DatasetBuilder:
    @staticmethod
    def get_loaders(batch_size=32, img_size=224, include_noise=False):
        db = get_db()
        
        # Normalization and transform
        train_transforms = transforms.Compose([
            transforms.RandomResizedCrop(img_size),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        val_transforms = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(img_size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
        
        # Build Datasets
        # If include_noise is True, we pass is_noisy=None to loader to get all samples
        is_noisy_val = None if include_noise else False
        train_dataset = MongoDataset(db, split="train", is_noisy=is_noisy_val, transform=train_transforms)
        
        # Validation is always clean for fair comparison
        val_dataset = MongoDataset(db, split="val", is_noisy=False, transform=val_transforms)
        
        if len(train_dataset) == 0:
            # Fallback if no images found
            train_loader = None
        else:
            train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
            
        if len(val_dataset) == 0:
            val_loader = train_loader # Use train as val if val is empty
        else:
            val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
            
        return train_loader, val_loader

