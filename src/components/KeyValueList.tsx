import type { ReactNode } from "react";
import { Info, Tag } from "lucide-react";
import { StatusBadge } from "./Badge";
import { formatAttributeValue, formatEmptyValue, formatLabel, isStatusValue } from "../utils/formatters";

type KeyValueItem = {
  label: string;
  value: ReactNode;
};

type KeyValueListProps = {
  title: string;
  type?: "context" | "attributes";
  items: KeyValueItem[];
};

export function KeyValueList({ title, type = "context", items }: KeyValueListProps) {
  const Icon = type === "attributes" ? Tag : Info;

  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <Icon className="h-4 w-4 text-blue-600" />
        {title}
      </div>
      <dl className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[minmax(80px,0.42fr)_minmax(0,1fr)] gap-3 rounded-lg bg-slate-50 px-3 py-2"
          >
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="min-w-0 break-words text-sm font-medium text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ContextList({ context }: { context: Record<string, unknown> | null | undefined }) {
  const safeCtx = context ?? {};
  const fields = ["who", "what", "when", "where", "why", "how", "result"];
  const items = fields.map((field) => ({
    label: formatLabel(field),
    value: formatEmptyValue(safeCtx[field]),
  }));

  return <KeyValueList title="Context" items={items} />;
}

export function AttributeList({ attributes }: { attributes: Record<string, unknown> | null | undefined }) {
  const safeAttrs = attributes ?? {};
  const items = Object.entries(safeAttrs).map(([key, value]) => ({
    label: formatLabel(key),
    value: isStatusValue(value) ? <StatusBadge status={value} /> : formatAttributeValue(key, value),
  }));

  return <KeyValueList title="Attributes" type="attributes" items={items} />;
}
