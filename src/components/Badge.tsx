import type { ReactNode } from "react";
import type { EventTense } from "../types/event";
import { cn } from "../utils/formatters";

type BadgeProps = {
  children: ReactNode;
  tone?: "blue" | "gray" | "green" | "yellow" | "orange" | "red" | "violet";
  className?: string;
};

const toneClassNames = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  gray: "border-slate-200 bg-slate-50 text-slate-700",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
  yellow: "border-amber-200 bg-amber-50 text-amber-700",
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  red: "border-red-200 bg-red-50 text-red-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
};

const eventToneMap: Record<string, BadgeProps["tone"]> = {
  merge_org: "blue",
  share_transfer: "violet",
  capital_increase: "green",
  financial_result: "orange",
  legal_case: "red",
  leadership_change: "yellow",
  asset_transaction: "gray",
};

const tenseToneMap: Record<EventTense, BadgeProps["tone"]> = {
  planned: "yellow",
  ongoing: "green",
  completed: "blue",
  unknown: "gray",
};

export function Badge({ children, tone = "gray", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EventTypeBadge({ eventType }: { eventType: string }) {
  return <Badge tone={eventToneMap[eventType] ?? "gray"}>{eventType}</Badge>;
}

export function TenseBadge({ tense }: { tense: EventTense | null | undefined }) {
  const resolvedTense = tense ?? "unknown";
  const tone = tenseToneMap[resolvedTense as EventTense] ?? "gray";
  return (
    <Badge tone={tone} className="capitalize">
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {resolvedTense}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "completed" ? "green" : status === "pending" ? "yellow" : "blue";
  return (
    <Badge tone={tone} className="capitalize">
      {status}
    </Badge>
  );
}
