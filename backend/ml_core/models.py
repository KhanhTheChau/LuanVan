import os
import torch
import torch.nn as nn
from torchvision import models

DEVICE = "cuda:0" if torch.cuda.is_available() else "cpu"

def get_arch(kind: str, num_classes: int = 27) -> nn.Module:
    """
    Khởi tạo kiến trúc model theo tham số kind
    """
    if kind == "resnet50":
        model = models.resnet50(weights=None)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
    elif kind == "convnext_base":
        model = models.convnext_base(weights=None)
        model.classifier[2] = nn.Linear(model.classifier[2].in_features, num_classes)
    elif kind == "efficientnet_b0":
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    elif kind == "densenet121":
        model = models.densenet121(weights=None)
        model.classifier = nn.Linear(model.classifier.in_features, num_classes)
    elif kind == "mobilenet_v2":
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    elif kind == "swin_v2_b":
        model = models.swin_v2_b(weights=None)
        model.head = nn.Linear(model.head.in_features, num_classes)
    elif kind == "vit_b_16":
        model = models.vit_b_16(weights=None)
        model.heads.head = nn.Linear(model.heads.head.in_features, num_classes)
    elif kind == "efficientnet_v2_m":
        model = models.efficientnet_v2_m(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    else:
        raise ValueError(f"Unsupported architecture: {kind}")
        
    model = model.to(DEVICE)
    return model

class ModelLoader:
    """
    Quản lý load weights cho model
    """
    @staticmethod
    def load_model(model: nn.Module, weight_path: str, device=DEVICE) -> nn.Module:
        if not os.path.exists(weight_path):
            raise FileNotFoundError(f"Weight path not found: {weight_path}")
            
        print(f"Loading weights from {weight_path} to {device}...")
        state_dict = torch.load(weight_path, map_location=device)
        
        # Extract direct state dict if needed
        if 'model_state_dict' in state_dict:
            state_dict = state_dict['model_state_dict']
            
        # Clean prefix
        if any(k.startswith('module.') for k in state_dict.keys()):
            state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
            
        # Logic to skip size mismatches (critical for head size differences like 27 vs 28)
        model_dict = model.state_dict()
        filtered_dict = {}
        skipped_keys = []
        
        for k, v in state_dict.items():
            if k in model_dict:
                if v.shape == model_dict[k].shape:
                    filtered_dict[k] = v
                else:
                    skipped_keys.append(f"{k} (Size Mismatch: {v.shape} vs {model_dict[k].shape})")
            else:
                # Optional: log unexpected keys
                pass
                
        if skipped_keys:
            print(f"WARNING: Skipped {len(skipped_keys)} layers due to size mismatch (e.g. classification head):")
            for sk in skipped_keys[:3]: # Log first 3 to avoid spam
                print(f"  - {sk}")

        # Load safely
        model.load_state_dict(filtered_dict, strict=False)
        model.eval()
        model = model.to(device)
        return model
