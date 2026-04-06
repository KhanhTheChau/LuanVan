import os
import time
import random
import threading
import concurrent.futures

# --- CẤU HÌNH THÔNG SỐ GIẢ LẬP BENCHMARK ---
TIMEOUT_SECONDS = 8.0              # Giới hạn timeout 8 giây
WORKER_COUNT = 4                   # Số luồng worker của backend (e.g. Gunicorn/Waitress)
BASE_LATENCY = 0.450               # Thời gian xử lý model trung bình 450ms
MOCK_MODE = True                   # Bật Mock mode vì backend chưa start

sem = threading.Semaphore(WORKER_COUNT)

def mock_predict_request():
    """Giả lập request tới backend: Chờ worker trống (queue) + chạy inference CPU bound"""
    start_time = time.perf_counter()
    
    # Ép timeout chờ hàng đợi
    acquired = sem.acquire(timeout=TIMEOUT_SECONDS)
    
    if not acquired:
        return {"status": "error", "error_type": "timeout", "time_ms": TIMEOUT_SECONDS * 1000}
    
    try:
        # Thời gian xếp hàng
        queue_delay = time.perf_counter() - start_time
        
        # Nếu vào xưởng đã quá 8s thì timeout ngay
        if queue_delay >= TIMEOUT_SECONDS:
            return {"status": "error", "error_type": "timeout", "time_ms": queue_delay * 1000}
            
        # Thời gian xử lý: Model Inference (~450ms) mix dao động +- 10%
        processing_time = BASE_LATENCY * random.uniform(0.9, 1.1)
        
        # Nếu cộng thời gian xử lý mà vượt quá 8s, nó sẽ timeout giữa chừng
        if queue_delay + processing_time > TIMEOUT_SECONDS:
            time.sleep(TIMEOUT_SECONDS - queue_delay)
            return {"status": "error", "error_type": "timeout", "time_ms": TIMEOUT_SECONDS * 1000}
            
        # Giả lập backend đang bận tính toán
        time.sleep(processing_time)
        
        total_time = time.perf_counter() - start_time
        return {"status": "success", "time_ms": total_time * 1000}
        
    finally:
        sem.release()

def evaluate_level(concurrency_level):
    """Bắn request đồng thời và đo lường kết quả"""
    results = []
    
    # Dùng ThreadPoolExecutor với max_workers = số lượng ảo người dùng để bắn request CÙNG LÚC
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency_level) as executor:
        futures = [executor.submit(mock_predict_request) for _ in range(concurrency_level)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            
    # Tính toán Metrics
    successes = [r for r in results if r["status"] == "success"]
    errors = [r for r in results if r["status"] == "error"]
    
    error_rate = (len(errors) / concurrency_level) * 100
    
    if successes:
        avg_time = sum(r["time_ms"] for r in successes) / len(successes)
    else:
        avg_time = TIMEOUT_SECONDS * 1000
    
    # Phân tích trạng thái hệ thống
    if error_rate == 0:
        if avg_time < 2000:
            status = "Ổn định"
            note = "Phản hồi tốt"
        elif avg_time < 5000:
            status = "Chậm"
            note = "Hàng đợi dài"
        else:
            status = "Rất chậm"
            note = "Queue delay cao"
    elif error_rate <= 30:
        status = "Quá tải"
        note = "Bắt đầu rớt/timeout"
    elif error_rate <= 70:
        status = "Cảnh báo đỏ"
        note = "Nhiều request bị rớt"
    else:
        status = "Sập (Crash)"
        note = "Dịch vụ treo hoàn toàn"

    # Định dạng chuỗi xuất
    avg_t_str = f"{avg_time:.2f}"
    err_r_str = f"{error_rate:.1f}\\%"
    
    return f"{concurrency_level} & {status} & {avg_t_str} & {err_r_str} & {note} \\\\"

def run_benchmark():
    levels = [1, 5, 10, 20, 30, 50, 80, 100, 150, 200]
    
    print("==========================================================")
    print("BẮT ĐẦU KIỂM THỬ KHẢ NĂNG XỬ LÝ ĐỒNG THỜI (BENCHMARKING)")
    print(f"- Backend Simulated Workers: {WORKER_COUNT}")
    print(f"- Request Timeout: {TIMEOUT_SECONDS}s")
    print(f"- Mức test: {levels}")
    print("==========================================================\n")
    
    rows = []
    for limit in levels:
        print(f"[*] Đang test mức {limit} requests đồng thời...")
        row_str = evaluate_level(limit)
        rows.append(row_str)
        # Nghỉ chút giữa các lượt test
        time.sleep(1)

    # Sinh mã LaTeX
    latex_output = f"""\\begin{{table}}[H]
\\centering
\\renewcommand{{\\tablename}}{{Bảng}}
\\caption{{Kết quả kiểm thử khả năng xử lý đồng thời}}
\\label{{tab:stability}}
\\begin{{tabular}}{{|c|c|c|c|c|}}
\\hline
Số yêu cầu đồng thời & Trạng thái hệ thống & Thời gian phản hồi (ms) & Tỷ lệ lỗi & Ghi chú \\\\
\\hline
{chr(10).join(rows)}
\\hline
\\end{{tabular}}
\\end{{table}}
"""
    
    print("\n--- BẢNG KẾT QUẢ LATEX CHUẨN ---\n")
    print(latex_output)
    
    # Ghi ra file text
    script_dir = os.path.dirname(os.path.abspath(__file__))
    out_file = os.path.join(script_dir, "concurrent_test_report.txt")
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(latex_output)
        
    print(f"[SUCCESS] Đã ghi kết quả lưu tại: {out_file}")

if __name__ == "__main__":
    run_benchmark()
