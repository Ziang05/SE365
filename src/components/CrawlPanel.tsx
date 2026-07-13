import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BrainCircuit,
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
  type FinancialEvent,
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
  /** Gọi lại khi crawl + inference xong để parent nhận real events */
  onCrawlComplete?: (events: FinancialEvent[]) => void;
}

// ────────────────────────────────────────────────────────────
// Pipeline step indicator
// ────────────────────────────────────────────────────────────

type StepState = "waiting" | "active" | "done";

interface PipelineStep {
  label: string;
  state: StepState;
}

function getPipelineSteps(status: CrawlStatus | "idle"): PipelineStep[] {
  if (status === "idle" || status === "pending") {
    return [
      { label: "Crawl CafeF", state: "waiting" },
      { label: "AI Inference", state: "waiting" },
      { label: "Hiển thị", state: "waiting" },
    ];
  }
  if (status === "running") {
    return [
      { label: "Crawl CafeF", state: "active" },
      { label: "AI Inference", state: "waiting" },
      { label: "Hiển thị", state: "waiting" },
    ];
  }
  if (status === "analyzing") {
    return [
      { label: "Crawl CafeF", state: "done" },
      { label: "AI Inference", state: "active" },
      { label: "Hiển thị", state: "waiting" },
    ];
  }
  if (status === "done") {
    return [
      { label: "Crawl CafeF", state: "done" },
      { label: "AI Inference", state: "done" },
      { label: "Hiển thị", state: "done" },
    ];
  }
  return [
    { label: "Crawl CafeF", state: "waiting" },
    { label: "AI Inference", state: "waiting" },
    { label: "Hiển thị", state: "waiting" },
  ];
}

function PipelineIndicator({ status, elapsed }: { status: CrawlStatus | "idle"; elapsed: number }) {
  const steps = getPipelineSteps(status);
  const showPipeline = status !== "idle" && status !== "error";
  if (!showPipeline) return null;

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
  };

  return (
    <div className="crawl-pipeline">
      {steps.map((step, i) => (
        <div key={step.label} className="flex min-w-0 items-center">
          {/* Step */}
          <div className={cn("crawl-pipeline__step", `crawl-pipeline__step--${step.state}`)}>
            <span className={cn("crawl-pipeline__dot", `crawl-pipeline__dot--${step.state}`)}>
              {step.state === "done" ? "✓" : i + 1}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </div>
          {/* Connector between steps */}
          {i < steps.length - 1 && (
            <span
              className={cn(
                "crawl-pipeline__connector",
                step.state === "done"
                  ? "crawl-pipeline__connector--done"
                  : "crawl-pipeline__connector--waiting",
              )}
            />
          )}
        </div>
      ))}
      {/* Elapsed timer */}
      {elapsed > 0 && (
        <span className="crawl-pipeline__timer">{formatElapsed(elapsed)}</span>
      )}
    </div>
  );
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
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    articles: number;
    events: number;
    at: string;
  } | null>(null);

  // ── Elapsed timer ──
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Backend health ──
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // ── Polling interval ref ──
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Check backend health on mount ──
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  // ── Timer helpers ──
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startTimeRef.current ?? Date.now())) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
          stopTimer();
          // Lấy kết quả events từ model
          const result = await getCrawlResult(id);
          setEventsCount(result.events_total);
          setLastResult({
            articles: result.total,
            events: result.events_total,
            at: new Date().toLocaleTimeString("vi-VN"),
          });
          onCrawlComplete?.(result.events);
        } else if (data.status === "error") {
          stopPolling();
          stopTimer();
          setErrorMsg(data.error ?? "Lỗi không xác định");
        }
      } catch (err) {
        stopPolling();
        stopTimer();
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : "Lỗi kết nối");
      }
    },
    [stopPolling, stopTimer, onCrawlComplete],
  );

  // ── Start crawl ──
  const handleStartCrawl = async () => {
    setErrorMsg(null);
    setLastResult(null);
    setEventsCount(null);
    setProgress({ current: 0, total: maxArticles });
    setArticlesCount(0);
    setElapsed(0);
    setStatus("pending");
    startTimer();

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
      stopTimer();
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Không thể kết nối backend");
    }
  };

  // ── Reset ──
  const handleReset = () => {
    stopPolling();
    stopTimer();
    setJobId(null);
    setStatus("idle");
    setProgress({ current: 0, total: 0 });
    setArticlesCount(0);
    setEventsCount(null);
    setElapsed(0);
    setErrorMsg(null);
  };

  // ── Cleanup on unmount ──
  useEffect(() => () => { stopPolling(); stopTimer(); }, [stopPolling, stopTimer]);

  // ── Derived ──
  const isRunning = status === "running" || status === "pending" || status === "analyzing";
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

          {/* ── Pipeline step indicator ── */}
          <PipelineIndicator status={status} elapsed={elapsed} />

          {/* ── Progress bar (running / analyzing) ── */}
          {isRunning && (
            <div className={cn("crawl-panel__progress-wrap", status !== "pending" && "mt-3")}>
              <div className="crawl-panel__progress-header">
                <span className="crawl-panel__progress-label">
                  {status === "analyzing" ? (
                    <BrainCircuit className="h-3.5 w-3.5 animate-pulse text-indigo-500" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  )}
                  {status === "pending"
                    ? "Đang khởi động..."
                    : status === "analyzing"
                      ? `Đang phân tích với AI model... (${articlesCount} bài)`
                      : `Đang crawl... ${articlesCount} bài`}
                </span>
                {status === "running" && progress.total > 0 && (
                  <span className="crawl-panel__progress-pct">{progressPercent}%</span>
                )}
              </div>

              <div className="crawl-panel__progress-bar">
                <div
                  className={cn(
                    "crawl-panel__progress-fill",
                    status === "analyzing" && "crawl-panel__progress-fill--analyzing",
                  )}
                  style={
                    status !== "analyzing"
                      ? { width: `${progress.total > 0 ? progressPercent : 100}%` }
                      : undefined
                  }
                />
              </div>

              {status === "running" && progress.total > 0 && (
                <p className="crawl-panel__progress-sub">
                  {progress.current} / {progress.total} bài
                </p>
              )}

              {status === "analyzing" && (
                <p className="crawl-panel__progress-sub">
                  NER → Topic → Event → Detail extraction...
                </p>
              )}
            </div>
          )}

          {/* ── Done banner ── */}
          {status === "done" && lastResult && (
            <div
              className={cn(
                "crawl-panel__result mt-3",
                lastResult.events > 0
                  ? "crawl-panel__result--success"
                  : "crawl-panel__result--info",
              )}
            >
              <CheckCircle2
                className={cn(
                  "h-4 w-4 shrink-0",
                  lastResult.events > 0 ? "text-emerald-500" : "text-blue-500",
                )}
              />
              <div className="min-w-0">
                <p className="font-semibold">
                  Hoàn thành lúc {lastResult.at}
                </p>
                <p className="mt-0.5 text-xs opacity-90">
                  Crawl{" "}
                  <strong>{lastResult.articles} bài</strong>
                  {lastResult.events > 0 ? (
                    <>
                      {" "}→ AI trích xuất được{" "}
                      <strong>{lastResult.events} sự kiện</strong> tài chính
                    </>
                  ) : (
                    <> — AI không phát hiện sự kiện tài chính nào</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── Error banner ── */}
          {status === "error" && (
            <div className="crawl-panel__result crawl-panel__result--error mt-3">
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
