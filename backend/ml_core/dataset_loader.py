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
        query = {"split": split, "is_noisy": is_noisy}
        # Only loading metadata initially to save RAM
        cursor = self.db.images.find(query, {"_id": 1, "label": 1})
        
        self.samples = list(cursor)
        
        # Mapping string labels to int
        # For a real implementation, you'd want a consistent label mapping.
        # This implementation dynamically generates it from the dataset or assumes 27 classes
        self.classes = sorted(list(set([s["label"] for s in self.samples])))
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
    def __len__(self):
        return len(self.samples)
        
    def __getitem__(self, idx):
        sample_meta = self.samples[idx]
        doc_id = sample_meta["_id"]
        label_str = sample_meta["label"]
        label_idx = self.class_to_idx[label_str]
        
        # Lazy load binary image data from DB
        doc = self.db.images.find_one({"_id": doc_id}, {"image_data": 1})
        img_bytes = doc["image_data"]
        
        # Convert bytes to PIL Image
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        if self.transform:
            img = self.transform(img)
            
        return img, label_idx

class DatasetBuilder:
    @staticmethod
    def get_loaders(batch_size=32, img_size=224):
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
        train_dataset = MongoDataset(db, split="train", is_noisy=False, transform=train_transforms)
        
        # Note: Depending on the dataset, if val split is empty, we might use train dataset or a subset
        val_dataset = MongoDataset(db, split="val", is_noisy=False, transform=val_transforms)
        
        if len(val_dataset) == 0:
            # Mock behavior if val doesn't exist yet
            val_dataset = train_dataset
            
        clean_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)
        
        return clean_loader, val_loader

