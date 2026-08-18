import type { Kind } from "./types";

/** Format a number with thousands separators, e.g. 12500 -> "12,500.00". */
export function num(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
  if (Number.isNaN(n as number)) return "0";
  return (n as number).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Label for a stock bucket, e.g. "25 kg bag" or "Loose". */
export function weightLabel(kind: Kind, bagWeightKg: number | null): string {
  if (kind === "loose") return "Loose";
  return `${num(bagWeightKg)} kg bag`;
}

/** Short bucket label, e.g. "25 kg" or "Loose". */
export function weightShort(kind: Kind, bagWeightKg: number | null): string {
  if (kind === "loose") return "Loose";
  return `${num(bagWeightKg)} kg`;
}

/** Format an ISO date (yyyy-mm-dd) as "04 Jun 2026". */
export function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00");
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Format a timestamptz as "04 Jun 2026, 3:21 PM". */
export function formatDateTime(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Today as yyyy-mm-dd in local time. */
export function today(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
