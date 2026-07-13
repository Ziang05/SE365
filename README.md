# FinDec AI - Frontend (SE365)

Đây là giao diện Web (Frontend) cho hệ thống Trích xuất sự kiện tài chính. Website được xây dựng bằng React và Vite, giúp bạn dễ dàng thao tác cào dữ liệu (crawl) và xem kết quả AI phân tích ngay trên màn hình.

## 🛠 Yêu cầu hệ thống
- **Node.js** phiên bản 18 trở lên.

## 🚀 Hướng dẫn cài đặt & chạy nhanh (Local)

### Bước 1: Cài đặt thư viện
Mở terminal (PowerShell/CMD) tại thư mục `SE365` và chạy lệnh sau để tải các gói cần thiết:

```bash
npm install
```

### Bước 2: Chạy Website
Đảm bảo rằng bạn **đã bật Backend** (ở thư mục `SE365-backend`) trước. Sau đó, chạy lệnh này để mở giao diện Web:

```bash
npm run dev
```

- Trình duyệt sẽ tự động nhận diện và bạn có thể truy cập web tại: `http://localhost:5173`.
- Bạn có thể nhấn nút "Crawl dữ liệu mới" trên web để bắt đầu trải nghiệm!

---
**💡 Mẹo nhỏ về file cấu hình:**
Website đã được thiết lập sẵn (thông qua Vite proxy) để tự động kết nối với Backend đang chạy ở cổng 8000 trên máy tính của bạn. Do đó, bạn **KHÔNG CẦN** phải tạo file `.env.local` hay cấu hình đường dẫn API gì cả. Cứ tải về, `npm install` và `npm run dev` là chạy!
