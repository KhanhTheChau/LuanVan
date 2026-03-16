import cv2
import numpy as np
import base64
import torch
import torch.nn as nn

class GradCAM:
    def __init__(self, model: nn.Module, target_layer: nn.Module):
        self.model = model
        self.target_layer = target_layer
        self.gradients = None
        self.activations = None
        
        # Hook the target layer
        self.target_layer.register_forward_hook(self.save_activation)
        self.target_layer.register_full_backward_hook(self.save_gradient)

    def save_activation(self, module, input, output):
        self.activations = output

    def save_gradient(self, module, grad_input, grad_output):
        # grad_output[0] is the gradient w.r.t the activation
        self.gradients = grad_output[0]

    def __call__(self, x: torch.Tensor, class_idx: int = None) -> np.ndarray:
        """
        Generate Grad-CAM heatmap for the target class
        x must be shape [1, C, H, W], normalized and on DEVICE
        """
        self.model.eval()
        
        # Forward pass
        logits = self.model(x)
        if class_idx is None:
            class_idx = torch.argmax(logits, dim=1).item()
            
        # Target for backprop
        score = logits[0, class_idx]
        
        # Backward pass
        self.model.zero_grad()
        score.backward()
        
        # Get gradients and activations
        gradients = self.gradients[0].cpu().data.numpy()  # [C, H, W]
        activations = self.activations[0].cpu().data.numpy()  # [C, H, W]
        
        # Calculate weights (global average pooling of gradients)
        weights = np.mean(gradients, axis=(1, 2))  # [C]
        
        # Multiply weights by activations
        heatmap = np.zeros(activations.shape[1:], dtype=np.float32)  # [H, W]
        for i, w in enumerate(weights):
            heatmap += w * activations[i]
            
        # ReLU on heatmap
        heatmap = np.maximum(heatmap, 0)
        
        # Normalize
        if np.max(heatmap) != 0:
            heatmap = heatmap / np.max(heatmap)
            
        return heatmap

def create_dashboard(
    img_raw: np.ndarray,
    heatmap: np.ndarray,
    bbox: list = None,
    score: float = 0.0,
    gt: str = "Unknown",
    pred: str = "Unknown",
    v_list: dict = None
) -> str:
    """
    Overlay Grad-CAM heatmap on original image and draw info
    img_raw: raw original BGR numpy array
    heatmap: normalized 2D numpy array [0,1]
    """
    if v_list is None:
        v_list = {}
        
    img_h, img_w = img_raw.shape[:2]
    
    # Resize heatmap to match image size
    heatmap_resized = cv2.resize(heatmap, (img_w, img_h))
    
    # Apply colormap
    heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
    
    # Overlay 
    alpha = 0.5
    overlay = cv2.addWeighted(img_raw, 1 - alpha, heatmap_colored, alpha, 0)
    
    # Optional: Draw bounding box
    if bbox and len(bbox) == 4:
        x_min, y_min, x_max, y_max = bbox
        cv2.rectangle(overlay, (int(x_min), int(y_min)), (int(x_max), int(y_max)), (0, 255,   0), 2)
    # Encode to base64
    _, buffer = cv2.imencode('.jpg', overlay)
    b64_str = base64.b64encode(buffer).decode('utf-8')
    prefix = "data:image/jpeg;base64,"
    
    return prefix + b64_str
