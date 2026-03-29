import os
import time
import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from datetime import datetime
from ml_core.dataset_loader import DatasetBuilder
from ml_core.models import get_arch, ModelLoader, DEVICE

def evaluate_model(model, dataloader):
    """Evaluate accuracy of the model on the given dataloader."""
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for i, l in dataloader: # No tqdm needed
            i, l = i.to(DEVICE), l.to(DEVICE)
            outputs = model(i)
            _, predicted = torch.max(outputs.data, 1)
            total += l.size(0)
            correct += (predicted == l).sum().item()
    return correct / total if total > 0 else 0.0

def run_unlearning_pipeline(experiment_id, model_name, method, db):
    """
    Core ML pipeline for Knowledge Distillation unlearning.
    Updates DB `experiments` and `training_logs` directly.
    """
    print(f"--- STARTING PIPELINE for Experiment: {experiment_id} ---")
    try:
        # Update status
        db.experiments.update_one({"_id": experiment_id}, {"$set": {"status": "running"}})
        
        num_classes = DatasetBuilder.get_num_classes()
        clean_loader, val_loader, test_loader = DatasetBuilder.get_loaders(batch_size=32)

        # 1. Load Student Model
        student_model = get_arch(model_name, num_classes)
        student_path = os.path.join(os.path.dirname(__file__), "..", "model", model_name)
        if os.path.exists(student_path):
            ModelLoader.load_model(student_model, student_path)
            
        # 2. Evaluate BEFORE unlearning (Using test loader)
        print("Evaluating BEFORE unlearning...")
        acc_before = evaluate_model(student_model, test_loader)
        
        db.experiments.update_one(
            {"_id": experiment_id},
            {"$set": {"acc_before": round(acc_before * 100, 2)}}
        )

        # 3. Simulate Noise Detection (or use existing)
        # Assuming DB is already populated with is_noisy values by a separate scan task.
        noisy_count = db.images.count_documents({"is_noisy": True})
        db.experiments.update_one({"_id": experiment_id}, {"$set": {"noisy_count": noisy_count}})

        # 4. Initialize Teacher Model
        teacher_model_name = "m6_convnext_b.pth"
        teacher_model = get_arch(teacher_model_name, num_classes)
        teacher_path = os.path.join(os.path.dirname(__file__), "..", "model", teacher_model_name)
        if os.path.exists(teacher_path):
            ModelLoader.load_model(teacher_model, teacher_path)
        for param in teacher_model.parameters(): param.requires_grad = False
        teacher_model.eval()

        # 5. KD Unlearning Loop
        optimizer_kd = optim.Adam(student_model.parameters(), lr=1e-5)
        criterion = nn.CrossEntropyLoss()
        criterion_kl = nn.KLDivLoss(reduction='batchmean')
        
        epochs_kd = 3 
        lam = 0.5
        temperature = 2.0

        for epoch in range(epochs_kd):
            student_model.train()
            running_loss = 0.0
            for x, y in clean_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                optimizer_kd.zero_grad()
                
                # Forward
                student_logits = student_model(x)
                with torch.no_grad():
                    teacher_logits = teacher_model(x)
                    
                loss_ce = criterion(student_logits, y)
                log_probs_student = F.log_softmax(student_logits / temperature, dim=1)
                probs_teacher = F.softmax(teacher_logits / temperature, dim=1)
                loss_kl = criterion_kl(log_probs_student, probs_teacher) * (temperature ** 2)
                
                loss = loss_ce + lam * loss_kl
                loss.backward()
                optimizer_kd.step()
                
                running_loss += loss.item()
                
            avg_loss = running_loss / len(clean_loader)
            
            # Evaluate Val
            val_acc = evaluate_model(student_model, val_loader)
            
            # Save Log
            db.training_logs.insert_one({
                "experiment_id": str(experiment_id),
                "epoch": epoch + 1,
                "loss": round(avg_loss, 4),
                "accuracy": round(val_acc * 100, 2),
                "phase": "unlearn",
                "timestamp": datetime.utcnow()
            })
            print(f"Epoch {epoch+1} - Loss: {avg_loss:.4f} | Val Acc: {val_acc*100:.2f}%")

        # 6. Evaluate AFTER unlearning
        print("Evaluating AFTER unlearning...")
        acc_after = evaluate_model(student_model, test_loader)
        improvement = (acc_after - acc_before) * 100
        
        # 7. Update DB & Finish
        db.experiments.update_one(
            {"_id": experiment_id},
            {
                "$set": {
                    "status": "done",
                    "acc_after": round(acc_after * 100, 2),
                    "improvement": round(improvement, 2),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        print("--- PIPELINE COMPLETED SUCCESSFULLY ---")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.experiments.update_one(
            {"_id": experiment_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.utcnow()}}
        )
