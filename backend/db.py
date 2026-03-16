import os
from pymongo import MongoClient
import threading
from werkzeug.security import generate_password_hash
from datetime import datetime

class DatabaseCache:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DatabaseCache, cls).__new__(cls)
                cls._instance._client = None
                cls._instance._db = None
            return cls._instance

    def get_db(self):
        if self._db is None:
            self._connect()
        return self._db

    def _connect(self):
        # Default to localhost if not specified
        mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
        db_name = os.environ.get("MONGO_DB_NAME", "plant_disease_db")
        
        try:
            self._client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
            # Verify connection
            self._client.admin.command('ping')
            self._db = self._client[db_name]
            print(f"Successfully connected to MongoDB -> DB: {db_name}")
            
            # Ensure collections exist and apply schemas
            self._initialize_collections()
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            raise e

    def _initialize_collections(self):
        """
        Verify collections exist and create the indexes/schema validation 
        based on System/01_system_architecture.md
        """
        # --- Collection: images ---
        if "images" not in self._db.list_collection_names():
            self._db.create_collection("images")
        
        # Images indexes
        self._db.images.create_index("filename")
        self._db.images.create_index("label")
        self._db.images.create_index("data_split")
        self._db.images.create_index("is_noisy")
        
        # --- Collection: unlearning_jobs ---
        if "unlearning_jobs" not in self._db.list_collection_names():
            self._db.create_collection("unlearning_jobs")
            
        # Job indexes
        self._db.unlearning_jobs.create_index("job_id", unique=True)
        self._db.unlearning_jobs.create_index("status")

        # --- Unified Collection: users ---
        if "users" not in self._db.list_collection_names():
            self._db.create_collection("users")
            
        self._db.users.create_index("username", unique=True)
        
        # Ensure default admin exists
        admin = self._db.users.find_one({"username": "admin"})
        if not admin:
            self._db.users.insert_one({
                "username": "admin",
                "password_hash": generate_password_hash("admin123"),
                "role": "admin",
                "created_at": datetime.utcnow()
            })
            print("Default admin account created in unified users collection.")
            
        # --- Unified Collection: sessions ---
        if "sessions" not in self._db.list_collection_names():
            self._db.create_collection("sessions")
            
        self._db.sessions.create_index("token", unique=True)
        
        # --- Collection: prediction_history ---
        if "prediction_history" not in self._db.list_collection_names():
            self._db.create_collection("prediction_history")
            
        self._db.prediction_history.create_index("user_id")


# Global instance
db_cache = DatabaseCache()

def get_db():
    return db_cache.get_db()

# Database Layer functionality (Step 1)
# 5. Kết nối MongoDB:
#    - file `backend/db.py`
#    - code kết nối MongoDB
#    - strictly follow the schema defined above
#    - không tự ý thay đổi schema
