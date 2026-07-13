import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import { EventCard } from "./EventCard";
import { EventTabs } from "./EventTabs";
import { CrawlPanel } from "./CrawlPanel";
import { mockEvents } from "../data/mockEvents";
import { UI_MAIN_TOPICS, mapTopicToUI } from "../utils/topicMapper";
import type { FinancialEvent } from "../types/event";
import type { FinancialEvent as ApiFinancialEvent } from "../services/crawlService";
import { cn } from "../utils/formatters";

const PAGE_SIZE = 3;

// ── Chuyển đổi FinancialEvent từ API → FinancialEvent cho UI ─────────────────
// API trả về main_topic = snake_case ("ownership_change"),
// UI cần UI label ("Biến động sở hữu & vốn") để lọc theo tab.
function normalizeEvent(raw: ApiFinancialEvent): FinancialEvent {
  return {
    ...raw,
    main_topic: mapTopicToUI(raw.main_topic),
    // context từ API đã match interface EventContext
    context: raw.context as FinancialEvent["context"],
  };
}

export function EventDashboard() {
  // ── Data state: bắt đầu từ mockEvents, thay bằng real khi crawl xong ──
  const [events, setEvents] = useState<FinancialEvent[]>(mockEvents);
  const [isRealData, setIsRealData] = useState(false);
  const [lastCrawlStats, setLastCrawlStats] = useState<{
    eventsCount: number;
    at: string;
  } | null>(null);

  // ── UI filter state ──
  const [selectedTopic, setSelectedTopic] = useState<string>(UI_MAIN_TOPICS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [minConfidence, setMinConfidence] = useState(0);
  
  // ── Refs & Toast ──
  const eventsSectionRef = useRef<HTMLElement>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Auto-hide toast ──
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // ── Callback từ CrawlPanel khi crawl + inference xong ──
  const handleCrawlComplete = (apiEvents: ApiFinancialEvent[]) => {
    if (apiEvents.length === 0) {
      // Không có event nào → giữ nguyên data cũ, thông báo qua stats
      setLastCrawlStats({ eventsCount: 0, at: new Date().toLocaleTimeString("vi-VN") });
      return;
    }

    const normalized = apiEvents.map(normalizeEvent);
    setEvents(normalized);
    setIsRealData(true);
    setLastCrawlStats({
      eventsCount: normalized.length,
      at: new Date().toLocaleTimeString("vi-VN"),
    });

    // Reset về tab đầu tiên có data
    const firstTopicWithData = UI_MAIN_TOPICS.find((t) =>
      normalized.some((e) => e.main_topic === t),
    );
    if (firstTopicWithData) {
      setSelectedTopic(firstTopicWithData);
    }
    setCurrentPage(1);
    setSelectedEventType("all");
    
    // Toast notification and scroll
    setToastMessage(`Đã trích xuất ${normalized.length} sự kiện thành công!`);
    setTimeout(() => {
      eventsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ── Computed options từ events hiện tại ──
  const eventTypeOptions = useMemo(() => {
    return Array.from(
      new Set(
        events
          .filter((event) => event.main_topic === selectedTopic)
          .map((event) => event.event_type),
      ),
    ).sort();
  }, [selectedTopic, events]);

  // ── Filter logic ──
  const filteredEvents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesTopic = event.main_topic === selectedTopic;
      if (!matchesTopic) return false;
      if (selectedEventType !== "all" && event.event_type !== selectedEventType) return false;
      if (event.confidence < minConfidence) return false;
      if (!normalizedQuery) return true;

      const searchableText = [
        event.title,
        event.event_type,
        event.evidence_text,
        ...event.entities_involved,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [minConfidence, searchQuery, selectedEventType, selectedTopic, events]);

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const safeCurrentPage = Math.min(currentPage, totalPages || 1);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const visibleEvents = filteredEvents.slice(startIndex, endIndex);
  const showingStart = filteredEvents.length > 0 ? startIndex + 1 : 0;
  const showingEnd = Math.min(endIndex, filteredEvents.length);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);
  const hasActiveFilters = selectedEventType !== "all" || minConfidence > 0;
  const minConfidencePercent = Math.round(minConfidence * 100);

  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
    setSelectedEventType("all");
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleEventTypeChange = (value: string) => {
    setSelectedEventType(value);
    setCurrentPage(1);
  };

  const handleMinConfidenceChange = (value: number) => {
    setMinConfidence(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedEventType("all");
    setMinConfidence(0);
    setCurrentPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="break-words text-2xl font-bold text-slate-950 md:text-3xl">
                    Event Extraction Dashboard
                  </h1>
                  {/* Badge cho biết đang dùng real data hay mock */}
                  {isRealData ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Sparkles className="h-3 w-3" />
                      Live AI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      Demo data
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600 md:text-base">
                  Hiển thị các sự kiện được trích xuất từ bản tin tài chính
                </p>
                {/* Stats khi vừa crawl xong */}
                {lastCrawlStats && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                    <BrainCircuit className="h-3.5 w-3.5 text-blue-500" />
                    {lastCrawlStats.eventsCount > 0
                      ? `AI trích xuất được ${lastCrawlStats.eventsCount} sự kiện lúc ${lastCrawlStats.at}`
                      : `Không phát hiện sự kiện mới lúc ${lastCrawlStats.at} — đang hiển thị dữ liệu trước`}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] xl:w-[660px]">
              <label className="relative min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Tìm kiếm sự kiện, thực thể, từ khóa..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                type="button"
                onClick={() => setIsFilterOpen((isOpen) => !isOpen)}
                className={cn(
                  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition",
                  hasActiveFilters || isFilterOpen
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700",
                )}
              >
                <Filter className="h-4 w-4" />
                Bộ lọc
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
              >
                <Calendar className="h-4 w-4" />
                <span className="whitespace-nowrap">01/05/2024 - 31/05/2024</span>
              </button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <label className="min-w-0">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Loại sự kiện
                </span>
                <select
                  value={selectedEventType}
                  onChange={(event) => handleEventTypeChange(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tất cả loại sự kiện</option>
                  {eventTypeOptions.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {eventType}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0">
                <span className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span>Độ tin cậy tối thiểu</span>
                  <span className="rounded-full bg-white px-2 py-1 text-blue-700">{minConfidencePercent}%</span>
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={minConfidence}
                  onChange={(event) => handleMinConfidenceChange(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-blue-600"
                />
              </label>

              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:text-slate-700"
              >
                Xóa lọc
              </button>
            </div>
          )}
        </header>

        {/* ── Crawl Panel ── */}
        <CrawlPanel onCrawlComplete={handleCrawlComplete} />

        <section ref={eventsSectionRef} className="rounded-2xl border border-slate-200 bg-white shadow-sm scroll-mt-6">
          <EventTabs events={events} selectedTopic={selectedTopic} onTopicChange={handleTopicChange} />

          <div className="space-y-4 p-4 md:p-5">
            {visibleEvents.length > 0 ? (
              visibleEvents.map((event, index) => (
                <EventCard key={event.id} event={event} featured={index === 0} />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Không tìm thấy sự kiện phù hợp</p>
                <p className="mt-1 text-sm text-slate-500">
                  {isRealData
                    ? "Thử đổi từ khóa tìm kiếm, chọn topic khác hoặc crawl thêm bài."
                    : "Bấm \"Crawl Data\" để tải dữ liệu thật từ CafeF và phân tích bằng AI."}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <p className="text-sm font-medium text-slate-600">
              Hiển thị {showingStart} - {showingEnd} trong tổng số {filteredEvents.length} sự kiện
            </p>
            <nav className="flex items-center gap-1" aria-label="Pagination">
              <PaginationButton
                disabled={safeCurrentPage === 1}
                ariaLabel="Trang trước"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </PaginationButton>
              {pageNumbers.map((page) => (
                <PaginationButton
                  key={page}
                  active={page === safeCurrentPage}
                  ariaLabel={`Trang ${page}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationButton>
              ))}
              {totalPages > 3 && <span className="px-2 text-sm font-semibold text-slate-400">...</span>}
              <PaginationButton
                disabled={totalPages === 0 || safeCurrentPage === totalPages}
                ariaLabel="Trang sau"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </PaginationButton>
            </nav>
          </div>
        </section>
      </div>

      {/* ── Toast Notification ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-lg animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          {toastMessage}
          <button
            type="button"
            className="ml-2 text-emerald-600 hover:text-emerald-800"
            onClick={() => setToastMessage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </main>
  );
}

function PaginationButton({
  children,
  active,
  disabled,
  ariaLabel,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition",
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700",
        disabled && "cursor-not-allowed opacity-45 hover:border-slate-200 hover:text-slate-700",
      )}
    >
      {children}
    </button>
  );
}
