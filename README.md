# Event Extraction Dashboard — Frontend

React + Vite frontend cho hệ thống trích xuất sự kiện tài chính từ tin tức CafeF.

## Yêu cầu

- Node.js ≥ 18
- npm

## Cài đặt

```bash
git clone <repo-url>
cd SE365-frontend

npm install
```

## Cấu hình

Copy file `.env.example` thành `.env.local` rồi điền URL backend:

```bash
copy .env.example .env.local
```

| Biến | Mô tả | Mặc định |
|------|--------|----------|
| `VITE_API_URL` | URL đầy đủ của backend FastAPI | *(trống = dùng Vite proxy `/api`)* |

**Local dev** (backend chạy cùng máy `:8000`): không cần set `VITE_API_URL`, Vite proxy tự xử lý.

**Production / deploy riêng**: set `VITE_API_URL=https://your-backend.railway.app`

## Chạy

```bash
# Development
npm run dev
# → http://localhost:5173

# Build production
npm run build
```

## Tính năng

- 📊 **Event Dashboard** — hiển thị sự kiện trích xuất từ tin tức tài chính
- 🔍 **Tìm kiếm & lọc** — theo topic, loại sự kiện, độ tin cậy
- 📡 **Crawl Panel** — bấm nút để crawl dữ liệu mới từ CafeF qua backend API
  - Real-time progress bar
  - Cấu hình nguồn, số bài, date range
  - Hiển thị trạng thái backend (online/offline)

## Cấu trúc

```
src/
├── components/
│   ├── EventDashboard.tsx   # Layout chính
│   ├── CrawlPanel.tsx       # Giao diện crawl data
│   ├── EventCard.tsx
│   ├── EventTabs.tsx
│   └── ...
├── services/
│   └── crawlService.ts      # HTTP client gọi backend
├── data/                    # Mock data
├── types/
└── utils/
```

## Backend liên quan

Xem repo backend: [SE365-backend](../SE365-backend) (hoặc link GitHub của bạn)
