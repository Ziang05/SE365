import { Quote } from "lucide-react";
import { EventTypeBadge, TenseBadge } from "./Badge";
import { ConfidenceBar } from "./ConfidenceBar";
import { EntityChips } from "./EntityChips";
import { AttributeList, ContextList } from "./KeyValueList";
import type { FinancialEvent } from "../types/event";
import { cn } from "../utils/formatters";

type EventCardProps = {
  event: FinancialEvent;
  featured?: boolean;
};

export function EventCard({ event, featured = false }: EventCardProps) {
  return (
    <article
      className={cn(
        "min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md",
        featured ? "p-5 md:p-6" : "p-4 md:p-5",
      )}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <EventTypeBadge eventType={event.event_type} />
          <h2 className={cn("break-words font-bold text-slate-950", featured ? "text-xl md:text-2xl" : "text-lg")}>
            {event.title}
          </h2>
        </div>
        <div className="shrink-0">
          <TenseBadge tense={event.context?.tense} />
        </div>
      </div>

      <div
        className={cn(
          "grid min-w-0 gap-4",
          featured
            ? "lg:grid-cols-[1.05fr_1.1fr_1.1fr_1.15fr] md:grid-cols-2"
            : "lg:grid-cols-[1fr_1fr_1fr_1.05fr] md:grid-cols-2",
        )}
      >
        <EntityChips entities={event.entities_involved} />
        <ContextList context={event.context} />
        <AttributeList attributes={event.attributes} />
        <section className="min-w-0 space-y-4">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Quote className="h-4 w-4 text-blue-600" />
              Evidence text
            </div>
            <blockquote className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm leading-7 text-slate-800">
              "{event.evidence_text}"
            </blockquote>
          </div>
          <ConfidenceBar confidence={event.confidence} />
        </section>
      </div>
    </article>
  );
}
