# Plant Disease Detection & Machine Unlearning System

## Overview

AI system phát hiện bệnh cây từ ảnh lá.
Sử dụng Deep Learning và GradCAM để giải thích mô hình (Explainable AI - XAI).
Hệ thống còn hỗ trợ Machine Unlearning để loại bỏ dữ liệu nhiễu (Ví dụ: Các mẫu bị nhãn sai hoặc dataset out-of-distribution) một cách có mục tiêu, giúp duy trì và bảo vệ tính khả dụng của mô hình lâu dài mà không cần training lại từ đầu.

## Features

- **Image Disease Prediction**: Dự đoán bệnh cây dựa trên mạng ResNet50 với 27 phân lớp (PlantDoc Dataset).
- **GradCAM Visualization**: Trực quan hóa Heatmap sự chú ý của mô hình trên lá cây ngay tại Front-End.
- **User Prediction History**: Hệ thống lưu lịch sử chẩn đoán bệnh đa nền tảng nhờ Account Management (User Role).
- **Prediction Feedback System**: Người dùng có thể gắn cờ, xác nhận kết quả dự đoán gửi về hệ thống quản lý.
- **Admin Dashboard**: Giao diện Control Center cho phép thống kê Dataset, phân tích chất lượng Unlearning, phê duyệt Feedback.
- **Dataset Analysis**: API thống kê số lượng ảnh bệnh, chia Train/Test/Val, phân tích nhãn bệnh của Dataset hiện có.
- **Machine Unlearning**: Quy trình tự động kích hoạt quên nhãn bị nhiễu chỉ trong thời gian ngắn (Sử dụng Celery Task & Redis).

## System Architecture

- **Frontend**: React (Vite) + Tailwind CSS + Lucide Icons + Axios
- **Backend**: Flask (Python) + Werkzeug Security + PyMongo
- **Database**: MongoDB
- **AI Model**: PyTorch (ResNet50 Architecture, Custom Finetune)
- **Task Queue**: Celery & Redis

## Project Structure

```text
LuanVan/
├── backend/
│   ├── app.py                   # Main Flask Server
│   ├── db.py                    # Database connection logic
│   ├── ml_core/                 # Models & AI utility code (GradCAM)
│   ├── routes/                  # API endpoints (auth, dataset, unlearn, predict, feedback)
│   ├── public/                  # Static file storage (saving images locally)
│   └── scripts/                 # Core AI Train/Test/Unlearning Scripts
├── frontend/
│   ├── index.html               # React Entry
│   ├── public/                  # Favicon & assets
│   ├── src/                     # React application source (pages, components, layouts, context)
│   └── tailwind.config.js       # UI Stylings
├── model/                       # Local model binary placement (.pth)
└── docs/                        # Specifications and design plans
```

## Installation

### 1. Start MongoDB
Ensure that MongoDB is running locally on default port 27017.
If you have Redis for celery, make sure `redis-server` is up as well.

### 2. Run Backend
Cần môi trường Python hoặc Conda (Ví dụ: `conda activate ct552`).
```bash
cd backend
pip install -r requirements.txt # (if applicable)
python app.py
```

*Optional*: Start Celery Worker for Unlearning processes.
```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

### 3. Run Frontend
Mở thư mục frontend cài đặt Node modules và khởi động Vite Server:
```bash
cd frontend
npm install
npm run dev
```
Sau đó truy cập trang web thông qua địa chỉ Terminal cung cấp (Thường là `http://localhost:5173`).

## Default Accounts

### Admin
- **username**: `admin`
- **password**: `admin123`

*(Tài khoản này được tự tạo trong Collection `users` khi Server Backend Boot thành công lần đầu)*

## Dataset
Project này sử dụng bộ dữ liệu **PlantDoc2** chuẩn hóa để training Custom Baseline Model ResNet50. Cấu trúc folder chuẩn của bộ dataset sẽ nằm trong thiết lập của `backend/dataset/`.

## Screenshots
- **Predict Page**: Cho phép Upload ảnh và quét Disease. Báo cáo Tỉ lệ (Confidence).
- **GradCAM Result**: Biểu đồ Gradient bám vào vị trí lá cây bị tổn thương.
- **Admin Dashboard**: Cho phép Admin cập nhật dữ liệu, xử lý Unlearning.
- **Feedback Portal**: Theo dõi những dự đoán model mắc sai sót do thiếu Data.

## License
MIT
