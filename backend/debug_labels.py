from db import get_db
import sys
import os

# Add backend dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

db = get_db()
labels = db.images.distinct("label")
print(f"Number of distinct labels: {len(labels)}")
print(f"Labels list: {sorted(labels)}")
