// ============================================================
// crawlService.ts — HTTP client cho FastAPI backend crawler
// ============================================================

// VITE_API_URL: URL backend đầy đủ, ví dụ https://your-api.railway.app
// Nếu không set thì dùng /api (proxy Vite local dev → localhost:8000)
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "/api";

export interface CrawlConfig {
  source: "rss" | "category" | "both";
  max_articles: number;
  include_content: boolean;
  start_date: string | null; // "YYYY-MM-DD" hoặc null
  end_date: string | null;   // "YYYY-MM-DD" hoặc null
}

export interface CrawlProgress {
  current: number;
  total: number;
}

export type CrawlStatus = "pending" | "running" | "done" | "error";

export interface CrawlStatusResponse {
  job_id: string;
  status: CrawlStatus;
  progress: CrawlProgress;
  articles_count: number;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface CrawledArticle {
  article_id: string;
  source: string;
  category: string;
  title: string;
  summary: string;
  url: string;
  published_date: string;
  usable_from_date: string;
  author: string;
  tags: string;
  content_length: number;
  crawled_at: string;
  crawl_error: string;
}

export interface CrawlResultResponse {
  job_id: string;
  articles: CrawledArticle[];
  total: number;
}

/** Bắt đầu một crawl job mới, trả về job_id ngay lập tức */
export async function startCrawl(config: CrawlConfig): Promise<string> {
  const response = await fetch(`${BASE_URL}/crawl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.job_id as string;
}

/** Poll trạng thái của một crawl job */
export async function getCrawlStatus(jobId: string): Promise<CrawlStatusResponse> {
  const response = await fetch(`${BASE_URL}/crawl/status/${jobId}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${response.status}`);
  }

  return response.json();
}

/** Lấy kết quả articles sau khi job done */
export async function getCrawlResult(jobId: string): Promise<CrawlResultResponse> {
  const response = await fetch(`${BASE_URL}/crawl/result/${jobId}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? `HTTP ${response.status}`);
  }

  return response.json();
}

/** Health check backend có sẵn sàng không */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    return response.ok;
  } catch {
    return false;
  }
}
