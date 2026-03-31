# TÀI LIỆU MÔ TẢ HỆ THỐNG (SYSTEM_DOCUMENTATION.md)

Tài liệu này cung cấp cái nhìn tổng quan về kiến trúc, tính năng và thiết kế kỹ thuật của hệ thống **Plant Disease Analysis & Machine Unlearning Management**.

---

## 1. Giới thiệu hệ thống

### 1.1. Mục tiêu
Hệ thống được xây dựng nhằm hỗ trợ quá trình nghiên cứu về nhận diện bệnh cây trồng (Plant Disease) và thực nghiệm phương pháp **Machine Unlearning (Giải học)**. Mục tiêu cốt lõi là cung cấp một công cụ quản lý tập dữ liệu, phân tích chất lượng dữ liệu (Data Quality) và so sánh hiệu năng giữa các mô hình sau khi thực hiện "quên" dữ liệu nhiễu.

### 1.2. Phạm vi
- Quản trị tập dữ liệu hình ảnh bệnh cây trồng (PlantDoc2).
- Phân tích và phát hiện nhiễu (Noise Detection) tự động.
- Quản lý phản hồi từ người dùng (User Feedback) để cải thiện nhãn dữ liệu.
- Theo dõi và so sánh các chỉ số Machine Unlearning (Accuracy, Precision, Recall, F1, Time).

---

## 2. Kiến trúc hệ thống

Hệ thống được thiết kế theo mô hình **Client-Server** hiện đại:

- **Frontend**: Xây dựng bằng **ReactJS (Vite)**, sử dụng **TailwindCSS** cho giao diện và **Recharts** để trực quan hóa dữ liệu. Giao diện được tối ưu hóa cho trải nghiệm quản trị (Admin Dashboard).
- **Backend API**: Sử dụng **Flask (Python)** để cung cấp các RESTful API. Tích hợp **Celery** kết hợp với **Redis** để xử lý các tác vụ nặng (huấn luyện mô hình, phân tích batch dataset) dưới nền.
- **AI/ML Core**: Sử dụng framework **PyTorch** để chạy các mô hình Deep Learning (ResNet50). Tích hợp kỹ thuật **Grad-CAM** để giải thích thuật toán.
- **Database**: Sử dụng **MongoDB** (NoSQL) để lưu trữ linh hoạt thông tin hình ảnh, phản hồi và kết quả thực nghiệm.

---

## 3. Các chức năng chính

### 3.1. Admin Dashboard (Tổng quan hệ thống)
Cung cấp cái nhìn toàn cảnh về tình trạng tập dữ liệu:
- **Dataset Statistics**: Thống kê số lượng ảnh, phân bố tập Train/Val/Test và dữ liệu nhiễu.
- **Data Quality Insights**: Tự động tính toán **Imbalance Ratio** (tỷ lệ mất cân bằng lớp) và **Training Readiness Score** (mức độ sẵn sàng huấn luyện).
- **Full Disease Distribution**: Biểu đồ cột ngang hiển thị chi tiết số lượng của tất cả các lớp bệnh (đã lọc bỏ lớp "Unknown").

### 3.2. Machine Unlearning (Quản lý Giải học)
Module dành riêng cho việc so sánh các mô hình nghiên cứu:
- **Model Comparison Table**: So sánh trực tiếp 3 phương pháp chính: Baseline (Knowledge Distillation), Retrain, và Improved Method.
- **Dynamic Highlighting**: Tự động tô đậm và làm nổi bật các chỉ số tốt nhất (Max cho Accuracy/F1, Min cho Training Time).
- **Full Evaluation Metrics**: Bảng chi tiết toàn bộ các lần chạy thực nghiệm.

### 3.3. Dataset Analysis (Phân tích dữ liệu)
Công cụ Oracle Pipeline để làm sạch dữ liệu:
- **Batch Analysis**: Chạy phân tích hàng loạt để phát hiện ảnh nhiễu (Noise) dựa trên các Voter ML.
- **Persistence**: Kết quả phân tích (Vote scores, IsNoisy) được lưu trực tiếp vào cơ sở dữ liệu để phục vụ việc lọc dữ liệu huấn luyện.

### 3.4. Feedback System (Hệ thống phản hồi)
Quy trình khép kín để cải thiện chất lượng nhãn:
- **Multipart Upload**: Người dùng gửi phản hồi kèm theo file ảnh thực tế từ quá trình dự đoán lỗi.
- **Admin Review**: Quản trị viên duyệt (Approve) hoặc từ chối (Reject) các phản hồi để điều chỉnh tập dữ liệu gốc.
- **Storage**: Ảnh phản hồi được lưu trữ vật lý tại `backend/public/uploads` và phục vụ qua HTTP static server.

---

## 4. Luồng hoạt động chính (Workflows)

### 4.1. Luồng Dự đoán & Phản hồi
1. Người dùng upload ảnh -> API `/predict` trả về kết quả kèm Grad-CAM.
2. Người dùng nhấn "Dự đoán sai" -> Frontend gửi file ảnh + metadata qua `FormData` tới `/predict_feedback`.
3. Quản trị viên vào tab Feedback để xem lại ảnh và nhãn đúng do người dùng đề xuất.

### 4.2. Luồng Phân tích Tập dữ liệu
1. Tuyển chọn danh sách ảnh từ MongoDB.
2. Kích hoạt Celery Task xử lý song song.
3. Cập nhật trường `is_noisy` và `vote_scores` vào collection `images`.
4. Dashboard cập nhật biểu đồ "Noisy Nodes" theo thời gian thực (Polling).

---

## 5. Thiết kế dữ liệu (Data Design)

### 5.1. Collection: `images`
Lưu trữ thông tin ảnh trong tập dữ liệu gốc:
- `filename`, `label`, `split` (train/test).
- `is_noisy` (Boolean), `vote_scores` (Object).

### 5.2. Collection: `prediction_feedback`
Lưu trữ đóng góp của người dùng:
- `image_path`: Đường dẫn ảnh lưu tại thư mục public.
- `predicted_label`, `feedback_type`, `status` (pending/approved).

### 5.3. Collection: `models`
Lưu trữ kết quả thực nghiệm Unlearning:
- `model_name`, `accuracy`, `precision`, `recall`, `f1`, `training_time`.

---

## 6. Lưu ý kỹ thuật quan trọng

- **Xử lý Đường dẫn (Windows vs Web)**: Do server chạy trên Windows nhưng truy cập qua Web, hệ thống sử dụng hàm chuẩn hóa đường dẫn để chuyển đổi dấu `\` thành `/` và loại bỏ các ký tự ổ đĩa tuyệt đối.
- **Static File Serving**: Thư mục `backend/public` được cấu hình làm static folder tuyệt đối để đảm bảo ảnh feedback luôn truy cập được qua URL `http://localhost:5000/public/...`.
- **Lọc dữ liệu Frontend**: Mọi chỉ số phân tích trên Dashboard đều được lọc bỏ lớp "Unknown" để đảm bảo tính chuyên môn của nghiên cứu bệnh cây trồng.

---

## 7. Kết luận
Hệ thống cung cấp một giải pháp toàn diện cho việc quản lý vòng đời dữ liệu và mô hình trong bài toán Machine Unlearning. Với kiến trúc module hóa và giao diện tập trung vào phân tích, hệ thống là công cụ đắc lực cho các nghiên cứu chuyên sâu về độ tin cậy của AI trong nông nghiệp.
