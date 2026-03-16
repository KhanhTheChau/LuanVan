# Hướng Dẫn Chạy Hệ Thống (RUN_SYSTEM.md)

Tài liệu này cung cấp hướng dẫn chi tiết để thiết lập và chạy toàn bộ hệ thống Plant Disease Unlearning cho mục đích phát triển (Development) tại môi trường local.

Hệ thống bao gồm 4 thành phần chính:
- **MongoDB**: Cơ sở dữ liệu chính.
- **Redis**: Message Broker & Result Backend cho Celery.
- **Backend (Flask + Celery)**: Cung cấp RESTful API và xử lý ML tasks.
- **Frontend (React + Vite)**: Giao diện người dùng.

---

## 1. System Requirements

Để chạy hệ thống thành công, máy tính của bạn cần cài đặt các phần mềm sau:

- **Python**: Phiên bản xử lý Machine Learning (Khuyến nghị Python 3.9 hoặc 3.10 trở lên).
- **Node.js**: Phiên bản 18.x trở lên (kèm theo `npm`).
- **MongoDB**: Máy chủ MongoDB chạy local ở cổng mặc định `27017` (URI: `mongodb://localhost:27017/`).
- **Redis**: Máy chủ Redis chạy local ở cổng mặc định `6379`. Bắt buộc phải có để Celery Task Worker hoạt động.

---

## 2. Setup Backend

Môi trường Backend sử dụng Python, Flask và PyTorch. 

### 2.1. Chuẩn bị môi trường Python
Mở Terminal ở thư mục gốc của dự án (`d:\KHMT\CT552-LV\LuanVan`) và làm theo các bước:

```bash
# Ưu tiên sử dụng môi trường ảo như conda để tránh xung đột
conda activate ct552

# Cài đặt các thư viện bắt buộc (nếu chưa cài)
pip install -r requirements.txt
```

### 2.2. Khởi động Backend API Server (Flask)
Trong Terminal đang activate môi trường, chạy lệnh sau để bật API ở cổng 5000:

```bash
python backend/app.py
```
*API sẽ chạy tại địa chỉ: `http://localhost:5000/api`*

### 2.3. Khởi động Backend Task Worker (Celery)
Hệ thống Machine Unlearning cần Celery worker chạy ngầm để train model. Bạn cần mở thêm **một Terminal mới** (cũng activate môi trường conda tương tự), đứng tại thư mục gốc, và chạy lệnh:

```bash
# Trên Windows, Celery cấu hình pool=solo thường hoạt động tốt nhất
celery -A backend.tasks.celery_app worker --pool=solo --loglevel=info
```
*Lưu ý: Bạn phải đảm bảo Redis Server đã được bật trước khi chạy Celery Worker.*

---

## 3. Setup Frontend

Môi trường Frontend được build trên ReactJS kết hợp Vite và TailwindCSS.

### 3.1. Cài đặt Node modules
Mở một **Terminal mới**, di chuyển tới thư mục frontend và cài đặt dependencies:

```bash
cd frontend
npm install
```

### 3.2. Khởi động Frontend Development Server
Sau khi cài đặt xong, chạy lệnh sau để bật giao diện:

```bash
npm run dev
```
*Vite sẽ khởi chạy server, mặc định UI sẽ hiển thị tại địa chỉ: `http://localhost:5173/` (hoặc cổng hiển thị trong Terminal).*

---

## 4. Run Full System (Thứ tự chuẩn)

Khi phát triển hoặc kiểm thử toàn bộ tính năng, hãy bật các tiến trình theo thứ tự chuẩn sau đây để tránh lỗi Connection Refused:

1. **Bật MongoDB Service**: (Kiểm tra service/daemon).
2. **Bật Redis Service**: (Kiểm tra service/redis-server.exe).
3. **Bật Celery Worker**: `celery -A backend.tasks.celery_app worker --pool=solo --loglevel=info`
4. **Bật Flask Server**: `python backend/app.py`
5. **Bật React UI**: `cd frontend && npm run dev`

---

## 5. Test API Cơ Bản

Sau khi hệ thống đã up, bạn có thể gọi một số API để test kết nối:

- **Kiểm tra danh sách dataset đã import**:
  ```bash
  curl http://localhost:5000/api/dataset/images
  ```
  *(Hoặc mở trình duyệt truy cập thẳng link trên, kết quả HTTP 200 kèm mảng JSON ảnh)*

- **Kiểm tra tiến trình Unlearning (Mock)**:
  ```bash
  curl http://localhost:5000/api/unlearn/status/sample-job-id
  ```

---

## 6. Common Issues (Lỗi thường gặp)

1. **MongoDB connection failed**:
   - *Nguyên nhân*: Service Mongo chưa chạy.
   - *Cách sửa*: Chạy MongoDB từ Services (Windows) hoặc dùng MongoDB Compass để Ensure kết nối ở `localhost:27017`.

2. **Celery không nhận được Task / Lỗi kết nối Redis**:
   - *Báo lỗi*: `Connection refused ... port 6379`.
   - *Cách sửa*: Hãy đảm bảo Redis đang chạy. Trên Windows, bạn có thể tải Redis installer phiên bản Windows và khởi động service.

3. **CORS Error**:
   - *Nguyên nhân*: API Server không khớp port bị trình duyệt chặn Request từ Vite Frontend (`5173` gọi vi phạm nguồn qua `5000`).
   - *Cách sửa*: Backend `app.py` đã bọc thư viện `Flask-CORS`, nếu vẫn lỗi hãy kiểm tra lại file `frontend/src/services/api.js` đã dùng đúng BASE_URL là `http://localhost:5000/api` chưa.

4. **Port Conflict**:
   - *Báo lỗi*: `Port 5000 is directly busy` (bị ứng dụng khác chiếm cổng).
   - *Cách sửa*: Vào `backend/app.py` đổi dòng `app.run(port=5000)` sang số port khác tĩnh rỗi (`5001`), đồng thời chỉnh lại `BASE_URL` bên `frontend/src/services/api.js`.
