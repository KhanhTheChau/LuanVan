import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim

def run_kd_unlearning(
    teacher_model: nn.Module,
    student_model: nn.Module,
    clean_loader,
    val_loader,
    epochs: int,
    lambda_val: float,
    temperature: float,
    device: str
):
    """
    Knowledge Distillation Unlearning (Algorithm 2)
    Yields metrics per epoch.
    """
    teacher_model.eval()
    for p in teacher_model.parameters():
        p.requires_grad = False
        
    student_model.train()
    
    optimizer_kd = optim.Adam(student_model.parameters(), lr=1e-5)
    criterion_ce = nn.CrossEntropyLoss()
    criterion_kl = nn.KLDivLoss(reduction='batchmean')
    
    for epoch in range(epochs):
        student_model.train()
        total_ce = 0.0
        total_kl = 0.0
        total_loss = 0.0
        num_batches = 0
        
        for x, y in clean_loader:
            x = x.to(device)
            y = y.to(device)
            
            optimizer_kd.zero_grad()
            
            # Forward passes
            student_logits = student_model(x)
            with torch.no_grad():
                teacher_logits = teacher_model(x)
                
            # Cross Entropy Loss
            loss_ce = criterion_ce(student_logits, y)
            
            # KL Distillation Loss
            log_probs_student = F.log_softmax(student_logits / temperature, dim=1)
            probs_teacher = F.softmax(teacher_logits / temperature, dim=1)
            loss_kl = criterion_kl(log_probs_student, probs_teacher) * (temperature ** 2)
            
            # Total Loss
            loss = loss_ce + lambda_val * loss_kl
            
            # Backprop
            loss.backward()
            optimizer_kd.step()
            
            total_ce += loss_ce.item()
            total_kl += loss_kl.item()
            total_loss += loss.item()
            num_batches += 1
            
        # Metrics Calculation
        avg_ce = total_ce / max(1, num_batches)
        avg_kl = total_kl / max(1, num_batches)
        avg_loss = total_loss / max(1, num_batches)
        
        # Validation
        student_model.eval()
        correct = 0
        total = 0
        
        with torch.no_grad():
            for x_val, y_val in val_loader:
                x_val = x_val.to(device)
                y_val = y_val.to(device)
                
                logits = student_model(x_val)
                preds = torch.argmax(logits, dim=1)
                
                correct += (preds == y_val).sum().item()
                total += y_val.size(0)
                
        val_acc = correct / max(1, total)
        
        # Yield results for Celery worker to catch and push to DB
        yield {
            "epoch": epoch + 1,
            "ce_loss": avg_ce,
            "kl_loss": avg_kl,
            "total_loss": avg_loss,
            "val_accuracy": float(val_acc)
        }

