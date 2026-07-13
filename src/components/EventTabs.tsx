import { UI_MAIN_TOPICS } from "../utils/topicMapper";
import type { FinancialEvent } from "../types/event";
import { cn } from "../utils/formatters";

type EventTabsProps = {
  events: FinancialEvent[];
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
};

export function EventTabs({ events, selectedTopic, onTopicChange }: EventTabsProps) {
  const counts = UI_MAIN_TOPICS.reduce<Record<string, number>>((acc, topic) => {
    acc[topic] = events.filter((event) => event.main_topic === topic).length;
    return acc;
  }, {});

  return (
    <div className="border-b border-slate-200">
      <div className="flex gap-1 overflow-x-auto">
        {UI_MAIN_TOPICS.map((topic) => {
          const isActive = topic === selectedTopic;
          return (
            <button
              key={topic}
              type="button"
              onClick={() => onTopicChange(topic)}
              className={cn(
                "relative flex shrink-0 items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:text-blue-700",
                isActive && "text-blue-700",
              )}
            >
              <span>{topic}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs",
                  isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600",
                )}
              >
                {counts[topic] ?? 0}
              </span>
              {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
