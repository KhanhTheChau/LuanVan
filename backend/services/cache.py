from db import get_db

class AppCache:
    def __init__(self):
        self.models = []
        self.dataset_stats = {}
        self.is_loaded = False

    def preload(self):
        print("--- Preloading Cache into Memory ---")
        db = get_db()
        
        # Preload models
        models = list(db.models.find({}, {"_id": 0}))
        self.models = models
        
        # Preload dataset stats
        total = db.images.count_documents({})
        train_count = db.images.count_documents({"data_split": "train"})
        val_count = db.images.count_documents({"data_split": "val"})
        test_count = db.images.count_documents({"data_split": "test"})
        clean_count = db.images.count_documents({"is_noisy": False})
        noisy_count = db.images.count_documents({"is_noisy": True})
        
        # Fetch label distribution
        labels = db.images.distinct("label")
        label_distribution = {}
        for label in labels:
            label_distribution[label] = db.images.count_documents({"label": label})
        
        self.dataset_stats = {
            "total": total,
            "splits": {
                "train": train_count,
                "val": val_count,
                "test": test_count
            },
            "noise": {
                "clean": clean_count,
                "noisy": noisy_count
            },
            "labels": label_distribution
        }
        self.is_loaded = True
        print(f"Cache Preloaded: {len(self.models)} models, {total} images.")

app_cache = AppCache()

def preload_cache():
    app_cache.preload()

def get_cache():
    if not app_cache.is_loaded:
        app_cache.preload()
    return app_cache
