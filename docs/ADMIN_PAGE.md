# Tài liệu Kỹ thuật - Trang Quản trị (Admin Dashboard)

## 1. Tổng quan
Trang quản trị (Admin Dashboard) là phân hệ dành riêng cho quản trị viên hệ thống (Admin) để giám sát hoạt động của nền tảng, quản lý dữ liệu gốc (dataset), theo dõi phân tích dữ liệu (analysis) và đặc biệt là kiểm soát quá trình học xóa bỏ (Machine Unlearning) cùng hệ thống phản hồi (Feedback). 
Tất cả các tuyến đường (routes) của trang quản trị đều yêu cầu xác thực và phân quyền (yêu cầu Admin token qua decorator `@require_admin` ở Backend).

## 2. Cấu trúc Frontend và Định tuyến
Tại Frontend (ReactJS), trang quản trị sử dụng `AdminLayout` và được định tuyến thông qua `AppRouter.jsx` với tiền tố path là `/admin`. 
- Giao diện sử dụng thư viện **TailwindCSS** (cho CSS) và **Lucide-React** (cho icon).
- Phân tích biểu đồ và trực quan hoá số liệu sử dụng **Recharts**.
- Module giao tiếp với backend được đóng gói qua `services/api.js`.

Hệ thống bao gồm 5 màn hình chính:

### 2.1. Dashboard Page (`/admin/dashboard` hoặc `/admin`)
**Chức năng:** Là trung tâm chỉ huy (Strategic Overview) cung cấp toàn bộ các số liệu thống kê mức cao nhất. Trang này tích hợp một hệ thống tab tĩnh (không đổi URL) để duyệt qua nhiều module giám sát chuyên sâu.
- **Strategic Overview:** Thống kê tổng số ảnh, tỉ lệ thành công, số lượng thí nghiệm (experiments) và tóm tắt thông minh (Summary Insight) so sánh thuật toán ASFN với Unlearning tiêu chuẩn.
- **Model Benchmarks:** So sánh hiệu suất (Accuracy, Precision, Recall, F1) giữa các kiến trúc mô hình.
- **Unlearning Analysis:** Đánh giá tính cân bằng giữa bảo toàn kiến thức (Retain Health) và mức độ quên chứng cứ (Residual Knowledge).
- **Attention Map:** Cung cấp công cụ cho phép Admin tải ngẫu nhiên ảnh trong dataset và kích hoạt thuật toán **Grad-CAM** để theo dõi vùng tập trung (Attention Trace) của mô hình.
- **Experiment Logs:** Hiển thị danh sách lịch sử các lượt huấn luyện/xóa bỏ kèm theo siêu tham số (hyperparameters) và kết quả tương ứng.

### 2.2. Dataset Management (`/admin/dataset`)
**Chức năng:** Quản trị hình ảnh gốc trong cơ sở dữ liệu.
- Quản lý danh sách hình ảnh sử dụng bảng dữ liệu.
- Hiển thị Tên file, Nhãn chuẩn (Label), Tập dữ liệu (Train/Val/Test), Trạng thái xử lý và đặc biệt là cờ **Noisy** (Đánh dấu mẫu dữ liệu bị nhiễu do thuật toán phát hiện).
- Có thanh tìm kiếm theo nhãn và tính năng phân trang cơ bản.

### 2.3. Dataset Analysis (`/admin/analyze`)
**Chức năng:** Cung cấp góc nhìn phân tích thống kê (Exploratory Data Analysis - EDA) trên toàn bộ kho dữ liệu ảnh.
- Gọi trực tiếp đến API thống kê để lấy dữ liệu.
- Vẽ biểu đồ PieChart về **Tỉ lệ phân chia tập dữ liệu** (Train / Val / Test).
- Vẽ biểu đồ PieChart về **Chất lượng dữ liệu** (Noisy vs Clean).
- Vẽ biểu đồ BarChart về **Phân bố nhãn bệnh** (Class Distribution) giúp admin phát hiện tình trạng mất cân bằng dữ liệu (imbalanced data).

### 2.4. Machine Unlearning (`/admin/unlearn`)
**Chức năng:** Bảng điều khiển thực thi cơ chế Máy Học Xóa Bỏ.
- Được thiết kế là nơi Admin can thiệp vào mô hình (Run Unlearning / KD ASFN) và kích hoạt đánh giá chéo (Ensemble Voting Eval).
- **Live Updates:** Cung cấp biểu đồ LineChart theo dõi tiến trình mất mát (Loss) và độ chính xác (Val Accuracy) theo thời gian thực (real-time updates thông qua cơ chế Auto-polling 3 giây/lần).
- **So sánh Hiệu suất:** Hiển thị biểu đồ cột đối chiếu Accuracy/F1 Score giữa mô hình ban đầu, mô hình sau Unlearning và mô hình Ensemble.
- **Forgetting Analysis:** Biểu đồ đối chiếu chuyên sâu về tỉ lệ quên nhãn mục tiêu với tỉ lệ bảo toàn trên hệ thống (Trade-off).

### 2.5. Feedback Management (`/admin/feedback`)
**Chức năng:** Quản lý vòng đời cập nhật dữ liệu tự động từ người dùng (Human-in-the-loop).
- Người dùng ở Frontend có quyền gửi phản hồi (Correct/Incorrect/Error) về kết quả chẩn đoán của hệ thống. 
- Tại đây, Admin sẽ xem xét hình ảnh, dự đoán gốc và phản hồi từ người dùng.
- Cung cấp hai hành động thao tác nhanh: **Approve** (Duyệt) và **Reject** (Từ chối). Việc duyệt phản hồi sẽ điều chỉnh trạng thái trong cơ sở dữ liệu định hướng cho các đợt Re-train hoặc Unlearning tiếp theo.

## 3. API Backend tương ứng
Các API nội bộ được tổ chức vào các Blueprint (`/routes`) riêng biệt của Flask Backend, giao tiếp bằng kết nối phân trang hoặc JSON Payload:

- **Module Dataset (`dataset.py`)**
  - `GET /images?limit=X&skip=Y`: Lấy danh sách hình ảnh nguyên lý (Loại trừ binary image data để tối ưu băng thông).
  - `GET /dataset/image/<image_id>`: Trả về Binary stream của hình ảnh qua `send_file`.
  - `GET /dataset/stats`: Trích xuất aggregate pipeline thống kê tổng số, noisy, nhãn và split.
  - `GET /system/stats`: Số liệu users, feedback và predictions.

- **Module Feedback (`feedback.py`)**
  - `GET /admin/feedback`: Liệt kê tất cả feedback của người dùng.
  - `POST /admin/feedback/update`: Cập nhật trạng thái `status` (approved/rejected).

- **Module Unlearn (`unlearn.py`)**
  - `POST /start`: API khởi chạy Celery Task huấn luyện Unlearning ngầm ở Background. Trả về `job_id`.
  - `GET /status/<job_id>`: Truy vấn trạng thái process của quá trình xóa bỏ.

- **Module Analysis (`analysis.py` - thông qua file `api.js`)**
  - Cung cấp các Endpoint trả về Metrics Performance (`getModelMetricsAll`), Forgetting Metrics (`getForgettingAnalysisAll`), Training Logs (`getTrainingProgress`).
  - Hỗ trợ API Grad-CAM (`getAttentionMap`) sử dụng cho trực quan quyết định (Explainability).

---
*Tài liệu này đóng vai trò là cơ sở để bảo trì, sửa lỗi và nâng cấp tính năng trên Dashboard quản trị hệ thống.*
