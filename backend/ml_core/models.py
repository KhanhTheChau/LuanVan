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
        # Lỗi 3: Luôn force load map_location theo device hiện tại (hoặc cpu) nếu RAM yếu
        state_dict = torch.load(weight_path, map_location=device)
        
        if 'model_state_dict' in state_dict:
            model.load_state_dict(state_dict['model_state_dict'], strict=False)
        else:
            if list(state_dict.keys())[0].startswith('module.'):
                state_dict = {k.replace('module.', ''): v for k, v in state_dict.items()}
            model.load_state_dict(state_dict, strict=False)
            
        # Lỗi 4: Đảm bảo model.eval()
        model.eval()
        model = model.to(device)
        return model
