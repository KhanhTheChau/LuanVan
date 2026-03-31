import os
import sys
import csv
from datetime import datetime

# Add parent directory to path to import backend modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from db import get_db

class CSVParser:
    """Handles reading and initial parsing of the CSV file."""
    def __init__(self, file_path):
        self.file_path = file_path

    def get_rows(self):
        """Reads CSV file and returns rows skipping the header."""
        if not os.path.exists(self.file_path):
            raise FileNotFoundError(f"CSV file not found at: {self.file_path}")
        
        rows = []
        with open(self.file_path, mode='r', encoding='utf-8') as f:
            reader = csv.reader(f)
            # Skip header
            next(reader, None)
            for row in reader:
                if any(row):  # Skip empty rows
                    rows.append(row)
        return rows

class MetricMapper:
    """Handles mapping of CSV indices to database fields and type conversion."""
    
    # Mapping configuration: index -> (field_name, type_converter)
    MAPPING = {
        0: ('model_name', str),
        1: ('precision_1', float),
        2: ('recall_1', float),
        3: ('f1_1', float),
        4: ('support_1', int),
        5: ('precision_2', float),
        6: ('recall_2', float),
        7: ('f1_2', float),
        8: ('support_2', int),
        9: ('accuracy', float),
        10: ('acc_percent', float),
        11: ('epoch', int),
        12: ('time', float),
        13: ('memory_mb', float),
        14: ('params', str)  # Keep as string as requested
    }

    @classmethod
    def map_row(cls, row):
        """Maps a single row list to a dictionary with correct types."""
        if len(row) < 15:
            raise ValueError(f"Insufficient columns. Expected at least 15, got {len(row)}")

        data = {}
        for index, (field, converter) in cls.MAPPING.items():
            val = row[index].strip()
            try:
                # Special handling for empty strings in numeric fields? 
                # For now, let the converter handle it (will raise ValueError)
                data[field] = converter(val)
            except ValueError:
                # For float/int, if it fails, maybe it has separators or symbols
                if converter in [float, int]:
                    # Clean potential separators like commas in numbers (e.g. 1,234.5)
                    # But params already handled as string.
                    cleaned_val = val.replace(',', '')
                    try:
                        data[field] = converter(cleaned_val)
                    except:
                        raise ValueError(f"Invalid {converter.__name__} value at index {index}: '{val}'")
                else:
                    raise ValueError(f"Invalid {converter.__name__} value at index {index}: '{val}'")
        
        return data

class MetricDBHandler:
    """Handles database operations for model metrics."""
    def __init__(self):
        self.db = get_db()
        self.collection = self.db.models

    def upsert_metric(self, data):
        """Updates an existing record or inserts a new one based on model_name and epoch."""
        query = {
            "model_name": data["model_name"],
            "epoch": data["epoch"]
        }
        
        update_doc = {
            "$set": data,
            "$setOnInsert": {
                "created_at": datetime.utcnow()
            }
        }
        
        # We don't want to overwrite created_at if it's an update
        # So we use $setOnInsert for it
        
        result = self.collection.update_one(query, update_doc, upsert=True)
        return result

def run_import(csv_path):
    """Main execution function for the import process."""
    print(f"\n--- STARTING IMPORT FROM: {csv_path} ---")
    
    parser = CSVParser(csv_path)
    mapper = MetricMapper()
    db_handler = MetricDBHandler()

    try:
        rows = parser.get_rows()
        print(f"Found {len(rows)} rows to process.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to read CSV: {e}")
        return

    success_count = 0
    fail_count = 0

    for i, row in enumerate(rows, start=2):  # Start from line 2 (after header)
        try:
            # 1. Map row
            metric_data = mapper.map_row(row)
            
            # 2. Upsert to DB
            result = db_handler.upsert_metric(metric_data)
            
            status = "Updated" if result.matched_count > 0 else "Inserted"
            # print(f"Line {i}: {status} {metric_data['model_name']} (Epoch {metric_data['epoch']})")
            success_count += 1
            
        except Exception as e:
            print(f"ERROR: Line {i} failed: {e}")
            fail_count += 1

    print("\n--- IMPORT SUMMARY ---")
    print(f"Total rows processed: {len(rows)}")
    print(f"Successfully imported: {success_count}")
    print(f"Failed: {fail_count}")
    print("----------------------\n")

def test_mapper():
    """Simple test to verify mapper logic."""
    print("Running internal tests...")
    sample_row = ["resnet50","0.67","0.61","0.60","231","0.69","0.61","0.60","231","0.61","67.85","7","550.89","89.89","23.563.355"]
    try:
        data = MetricMapper.map_row(sample_row)
        assert data['model_name'] == 'resnet50'
        assert data['epoch'] == 7
        assert isinstance(data['accuracy'], float)
        assert data['params'] == '23.563.355'
        print("Tests passed!")
    except Exception as e:
        print(f"Tests failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Path to CSV
    # Using absolute path from user request or relative to backend
    default_csv = os.path.join(backend_dir, "matric", "data.csv")
    
    # Run tests first
    test_mapper()
    
    # Run import
    run_import(default_csv)
