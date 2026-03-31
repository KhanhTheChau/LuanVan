from db import get_db
import json

db = get_db()
cursor = db.prediction_feedback.find().limit(5)
for doc in cursor:
    doc["_id"] = str(doc["_id"])
    if "created_at" in doc:
        doc["created_at"] = doc["created_at"].isoformat()
    print(json.dumps(doc, indent=2))
