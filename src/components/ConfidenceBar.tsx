import { ShieldCheck } from "lucide-react";
import { getConfidenceMeta, getConfidencePercent } from "../utils/formatters";

type ConfidenceBarProps = {
  confidence: number;
};

export function ConfidenceBar({ confidence }: ConfidenceBarProps) {
  const percent = getConfidencePercent(confidence);
  const meta = getConfidenceMeta(confidence);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
            <p className={`text-sm font-semibold ${meta.textClassName}`}>{meta.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-900">{confidence.toFixed(2)}</p>
          <p className="text-xs font-medium text-slate-500">{percent}%</p>
        </div>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${meta.barClassName}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
