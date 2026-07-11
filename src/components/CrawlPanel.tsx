import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  RefreshCw,
  Rss,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  type CrawlConfig,
  type CrawlStatus,
  type CrawlStatusResponse,
  checkBackendHealth,
  getCrawlResult,
  getCrawlStatus,
  startCrawl,
} from "../services/crawlService";
import { cn } from "../utils/formatters";

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

interface CrawlPanelProps {
  /** Gọi lại khi crawl xong để parent có thể reload data */
  onCrawlComplete?: (articlesCount: number) => void;
}

// ────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────

export function CrawlPanel({ onCrawlComplete }: CrawlPanelProps) {
  // ── Config state ──
  const [source, setSource] = useState<CrawlConfig["source"]>("category");
  const [maxArticles, setMaxArticles] = useState(20);
  const [includeContent, setIncludeContent] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showConfig, setShowConfig] = useState(false);

  // ── Job state ──
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<CrawlStatus | "idle">("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [articlesCount, setArticlesCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ total: number; at: string } | null>(null);

  // ── Backend health ──
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // ── Polling interval ref ──
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Check backend health on mount ──
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  // ── Stop polling ──
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // ── Poll status ──
  const poll = useCallback(
    async (id: string) => {
      try {
        const data: CrawlStatusResponse = await getCrawlStatus(id);
        setStatus(data.status);
        setProgress(data.progress);
        setArticlesCount(data.articles_count);

        if (data.status === "done") {
          stopPolling();
          // Lấy kết quả
          const result = await getCrawlResult(id);
          setLastResult({
            total: result.total,
            at: new Date().toLocaleTimeString("vi-VN"),
          });
          onCrawlComplete?.(result.total);
        } else if (data.status === "error") {
          stopPolling();
          setErrorMsg(data.error ?? "Lỗi không xác định");
        }
      } catch (err) {
        stopPolling();
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Lỗi kết nối");
      }
    },
    [stopPolling, onCrawlComplete],
  );

  // ── Start crawl ──
  const handleStartCrawl = async () => {
    setErrorMsg(null);
    setLastResult(null);
    setProgress({ current: 0, total: maxArticles });
    setArticlesCount(0);
    setStatus("pending");

    try {
      const config: CrawlConfig = {
        source,
        max_articles: maxArticles,
        include_content: includeContent,
        start_date: startDate || null,
        end_date: endDate || null,
      };

      const id = await startCrawl(config);
      setJobId(id);

      // Bắt đầu poll mỗi 2 giây
      pollRef.current = setInterval(() => poll(id), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Không thể kết nối backend");
    }
  };

  // ── Reset ──
  const handleReset = () => {
    stopPolling();
    setJobId(null);
    setStatus("idle");
    setProgress({ current: 0, total: 0 });
    setArticlesCount(0);
    setErrorMsg(null);
  };

  // ── Cleanup on unmount ──
  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Derived ──
  const isRunning = status === "running" || status === "pending";
  const progressPercent =
    progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="crawl-panel">
      {/* ── Header row ── */}
      <div className="crawl-panel__header">
        <div className="crawl-panel__title-group">
          <div className="crawl-panel__icon">
            <Rss className="h-4 w-4" />
          </div>
          <div>
            <h2 className="crawl-panel__title">Crawl CafeF</h2>
            <p className="crawl-panel__subtitle">
              Tải tin tức chứng khoán mới nhất từ CafeF
            </p>
          </div>
        </div>

        <div className="crawl-panel__actions">
          {/* Backend status badge */}
          <span
            className={cn(
              "crawl-panel__health-badge",
              backendOnline === true && "crawl-panel__health-badge--online",
              backendOnline === false && "crawl-panel__health-badge--offline",
              backendOnline === null && "crawl-panel__health-badge--checking",
            )}
          >
            {backendOnline === true ? (
              <Wifi className="h-3 w-3" />
            ) : backendOnline === false ? (
              <WifiOff className="h-3 w-3" />
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
            {backendOnline === true
              ? "Backend online"
              : backendOnline === false
                ? "Backend offline"
                : "Đang kiểm tra..."}
          </span>

          {/* Config toggle */}
          <button
            type="button"
            id="crawl-config-toggle"
            className="crawl-panel__config-btn"
            onClick={() => setShowConfig((v) => !v)}
            disabled={isRunning}
          >
            {showConfig ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Cài đặt
          </button>

          {/* Main action button */}
          {isRunning ? (
            <button
              type="button"
              id="crawl-stop-btn"
              className="crawl-panel__btn crawl-panel__btn--danger"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4" />
              Huỷ
            </button>
          ) : status === "done" || status === "error" ? (
            <button
              type="button"
              id="crawl-reset-btn"
              className="crawl-panel__btn crawl-panel__btn--secondary"
              onClick={handleReset}
            >
              <RefreshCw className="h-4 w-4" />
              Crawl lại
            </button>
          ) : (
            <button
              type="button"
              id="crawl-start-btn"
              className="crawl-panel__btn crawl-panel__btn--primary"
              onClick={handleStartCrawl}
              disabled={backendOnline === false}
            >
              <Download className="h-4 w-4" />
              Crawl Data
            </button>
          )}
        </div>
      </div>

      {/* ── Config panel (collapsible) ── */}
      {showConfig && !isRunning && (
        <div className="crawl-panel__config">
          <div className="crawl-panel__config-grid">
            {/* Source */}
            <label className="crawl-panel__field">
              <span className="crawl-panel__label">Nguồn dữ liệu</span>
              <select
                id="crawl-source"
                value={source}
                onChange={(e) => setSource(e.target.value as CrawlConfig["source"])}
                className="crawl-panel__select"
              >
                <option value="category">Category (HTML)</option>
                <option value="rss">RSS Feed</option>
                <option value="both">Cả hai</option>
              </select>
            </label>

            {/* Max articles */}
            <label className="crawl-panel__field">
              <span className="crawl-panel__label">
                Số bài tối đa
                <span className="crawl-panel__hint">0 = không giới hạn</span>
              </span>
              <input
                id="crawl-max-articles"
                type="number"
                min={0}
                max={500}
                value={maxArticles}
                onChange={(e) => setMaxArticles(Number(e.target.value))}
                className="crawl-panel__input"
              />
            </label>

            {/* Start date */}
            <label className="crawl-panel__field">
              <span className="crawl-panel__label">Từ ngày</span>
              <input
                id="crawl-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="crawl-panel__input"
              />
            </label>

            {/* End date */}
            <label className="crawl-panel__field">
              <span className="crawl-panel__label">Đến ngày</span>
              <input
                id="crawl-end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="crawl-panel__input"
              />
            </label>
          </div>

          {/* Include content toggle */}
          <label className="crawl-panel__toggle">
            <input
              id="crawl-include-content"
              type="checkbox"
              checked={includeContent}
              onChange={(e) => setIncludeContent(e.target.checked)}
              className="crawl-panel__checkbox"
            />
            <span className="crawl-panel__toggle-label">
              Tải nội dung đầy đủ
              <span className="crawl-panel__hint">
                — Vào từng trang chi tiết, chậm hơn nhưng có full text
              </span>
            </span>
          </label>
        </div>
      )}

      {/* ── Status / Progress ── */}
      {status !== "idle" && (
        <div className="crawl-panel__status-area">
          {/* Running: progress bar */}
          {isRunning && (
            <div className="crawl-panel__progress-wrap">
              <div className="crawl-panel__progress-header">
                <span className="crawl-panel__progress-label">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  {status === "pending" ? "Đang khởi động..." : `Đang crawl... ${articlesCount} bài`}
                </span>
                {progress.total > 0 && (
                  <span className="crawl-panel__progress-pct">{progressPercent}%</span>
                )}
              </div>
              <div className="crawl-panel__progress-bar">
                <div
                  className="crawl-panel__progress-fill"
                  style={{ width: `${progress.total > 0 ? progressPercent : 100}%` }}
                />
              </div>
              {progress.total > 0 && (
                <p className="crawl-panel__progress-sub">
                  {progress.current} / {progress.total} bài
                </p>
              )}
            </div>
          )}

          {/* Done */}
          {status === "done" && lastResult && (
            <div className="crawl-panel__result crawl-panel__result--success">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <p>
                Crawl xong! Lấy được{" "}
                <strong>{lastResult.total} bài</strong> lúc {lastResult.at}.
                File đã lưu tại <code>data/raw/cafef_news.csv</code>.
              </p>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="crawl-panel__result crawl-panel__result--error">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <p>
                <strong>Lỗi:</strong> {errorMsg}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
