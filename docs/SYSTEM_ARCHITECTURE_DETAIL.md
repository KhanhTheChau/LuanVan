# TÀI LIỆU KIẾN TRÚC HỆ THỐNG CHI TIẾT (SYSTEM ARCHITECTURE SPECIFICATION)
## Dự án: Attention-based Selective Forgetting Network (ASFN) for Plant Disease Detection

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)
Hệ thống là một nền tảng hỗ trợ chẩn đoán bệnh cây trồng dựa trên học máy (Deep Learning), tích hợp các kỹ thuật tiên tiến về **Giải thích được (XAI)** và **Máy học xóa bỏ (Machine Unlearning)**. Trọng tâm của nghiên cứu là giải quyết vấn đề dữ liệu nhiễu (noisy data) thông qua cơ chế học quên chọn lọc, giúp mô hình duy trì hiệu suất cao mà không cần huấn luyện lại toàn bộ khi phát hiện dữ liệu lỗi.

---

## 2. KIẾN TRÚC TỔNG THỂ (SYSTEM ARCHITECTURE)
Hệ thống được thiết kế theo mô hình **Client-Server** với các thành phần tách biệt:

- **Frontend (Giao diện người dùng)**: ReactJS (Vite, TailwindCSS).
- **Backend (Trung tâm xử lý)**: Python Flask (RESTful API).
- **Asynchronous Task Queue (Tác vụ nền)**: Celery + Redis (Xử lý huấn luyện và Unlearning).
- **Database (Cơ sở dữ liệu)**: MongoDB (NoSQL cho tính linh hoạt dữ liệu ảnh).
- **ML Engine**: PyTorch (Xây dựng và huấn luyện mô hình).

---

## 3. PHÂN HỆ NGƯỜI DÙNG (USER MODULE)
Phân hệ này tập trung vào trải nghiệm chẩn đoán nhanh chóng và minh bạch.

### 3.1. Quy trình Chẩn đoán (Prediction Pipeline)
1.  **Upload**: Người dùng tải lên ảnh lá cây bị bệnh qua `UploadBox`.
2.  **Inference**: Backend sử dụng mô hình tối ưu (ViT, ResNet, hoặc Ensemble) để dự đoán nhãn bệnh.
3.  **Grad-CAM (XAI)**: Hệ thống sinh ra bản đồ nhiệt (Heatmap) để trực quan hóa vùng mô hình tập trung quyết định.
4.  **Phản hồi (Feedback Loop)**: Người dùng có thể đánh giá kết quả (Chính xác / Sai nhãn / Ảnh nhiễu).

---

## 4. PHÂN HỆ QUẢN TRỊ & NGHIÊN CỨU (ADMIN & RESEARCH MODULE)
Đây là "trái tim" của luận văn, nơi thực thi các cơ chế nghiên cứu mới nhất.

### 4.1. Quản lý Dữ liệu Nhiễu (Noisy Data Management)
- **Automatic Detection**: Sử dụng hệ thống **Ensemble Voting** với 5 tiêu chí:
    1.  **ROI Focus**: Kiểm tra độ tập trung vùng chú ý.
    2.  **Crop Invariance**: Độ ổn định khi cắt ảnh ngẫu nhiên.
    3.  **Confidence**: Ngưỡng độ tin cậy.
    4.  **TTA Disagreement**: Sự sai khác khi tăng cường dữ liệu thử nghiệm.
    5.  **Ensemble Conflict**: Sự bất đồng giữa các kiến trúc mô hình (ResNet vs ViT).
- **Manual Review**: Admin phê duyệt các phản hồi từ người dùng để xác nhận mẫu dữ liệu cần xóa bỏ.

### 4.2. Cơ chế Machine Unlearning (ASFN)
- **Selective Forgetting**: Thực hiện xóa bỏ ảnh hưởng của một nhóm dữ liệu cụ thể (noisy/incorrect) ra khỏi trọng số mô hình.
- **ASFN Implementation**: Sử dụng **Knowledge Distillation (KD)** kết hợp với trọng số từ **Attention Map** để bảo toàn kiến thức trên các lớp dữ liệu sạch (Retain set) trong khi xóa nhanh kiến thức trên dữ liệu lỗi (Forgetting set).
- **Real-time Monitoring**: Theo dõi Loss và Accuracy qua biểu đồ LineChart trong quá trình Unlearning.

---

## 5. CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)
Hệ thống sử dụng MongoDB với các Collection chính:

- **images**: Lưu siêu dữ liệu ảnh (filename, label, dataset split, path).
- **model**: Lưu thông tin kiến trúc và các chỉ số đo lường (Metrics: Accuracy, F1, Loss).
- **unlearning_jobs**: Lưu trạng thái, log và tham số của các thí nghiệm xóa bỏ.
- **prediction_history**: Lưu vết các lượt chẩn đoán và feedback tương ứng.

---

## 6. DANH MỤC CÁC MÔ HÌNH HỖ TRỢ
Hệ thống hỗ trợ đa dạng kiến trúc để so sánh thực nghiệm:
- **ResNet50**: Baseline truyền thống.
- **ConvNeXt_Tiny / Base**: Kiến trúc CNN hiện đại.
- **Vision Transformer (ViT_B_16)**: Kiến trúc Transformer mạnh mẽ.
- **EfficientNet_V2_M**: Tối ưu giữa hiệu năng và tham số.

---

## 7. CÁC TIÊU CHÍ ĐÁNH GIÁ (EVALUATION METRICS)
Để minh chứng cho luận văn, hệ thống cung cấp:
1.  **Metric Truyền thống**: Accuracy, Precision, Recall, F1 for Clean Dataset.
2.  **Metric Unlearning**:
    - **Forgetting Rate**: Khả năng quên nhãn mục tiêu.
    - **Model Degradation**: Mức độ suy giảm hiệu suất trên tập dữ liệu còn lại.
    - **Unlearning Time**: Tốc độ so với Retrain (huấn luyện lại từ đầu).

---

## 8. QUY TRÌNH TRIỂN KHAI (DEPLOYMENT)
- **Backend API**: Chạy trên cổng `5000`.
- **Frontend App**: Chạy trên cổng `5173` (Vite).
- **Celery Worker**: Chạy song song để thực thi CPU/GPU heavy tasks.
- **Storage**: Lưu trữ ảnh gốc tại thư mục `plantdoc2/`.

---
*Tài liệu này được biên soạn làm cơ sở kỹ thuật cho Luận văn Tốt nghiệp ngành KHMT. Ngày cập nhật: 30/03/2026.*
