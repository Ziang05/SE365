const EMPTY_TEXT = "Chưa rõ";
const STATUS_VALUES = new Set(["proposed", "completed", "pending", "ongoing", "planned"]);

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatEmptyValue(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_TEXT;
  if (typeof value === "string" && value.trim() === "") return EMPTY_TEXT;
  return String(value);
}

export function isStatusValue(value: unknown): value is string {
  return typeof value === "string" && STATUS_VALUES.has(value.toLowerCase());
}

export function formatAttributeValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return EMPTY_TEXT;

  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatEmptyValue(item)).join(", ") : EMPTY_TEXT;
  }

  if (typeof value === "object") {
    const maybeUnitValue = value as { value?: unknown; unit?: unknown };
    if ("value" in maybeUnitValue || "unit" in maybeUnitValue) {
      const amount = formatEmptyValue(maybeUnitValue.value);
      const unit = formatEmptyValue(maybeUnitValue.unit);
      return unit === EMPTY_TEXT ? amount : `${amount} ${unit}`;
    }

    return JSON.stringify(value);
  }

  if (typeof value === "number") {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("pct") || lowerKey.includes("percent")) {
      return `${value}%`;
    }
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  return formatEmptyValue(value);
}

export function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bPct\b/g, "%");
}

export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getConfidenceMeta(confidence: number) {
  if (confidence >= 0.8) {
    return {
      label: "Rất cao",
      barClassName: "bg-blue-600",
      textClassName: "text-blue-700",
    };
  }

  if (confidence >= 0.6) {
    return {
      label: "Cao/Trung bình",
      barClassName: "bg-emerald-500",
      textClassName: "text-emerald-700",
    };
  }

  return {
    label: "Cần kiểm tra",
    barClassName: "bg-orange-500",
    textClassName: "text-orange-700",
  };
}

export function getConfidencePercent(confidence: number) {
  return Math.round(Math.max(0, Math.min(confidence, 1)) * 100);
}
