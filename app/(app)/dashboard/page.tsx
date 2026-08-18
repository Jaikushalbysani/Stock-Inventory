import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num, formatDate, today, weightShort } from "@/lib/format";
import type { CurrentStock, TransactionRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const td = today();

  const [stockRes, todayRes, recentRes] = await Promise.all([
    supabase.from("current_stock").select("*").single(),
    supabase.from("transactions").select("type, total_kg").eq("txn_date", td),
    supabase
      .from("transactions")
      .select("*, dealers(name, phone, address)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const stock = (stockRes.data ?? { total_bags: 0, total_kg: 0 }) as CurrentStock;
  const todayTxns = (todayRes.data ?? []) as { type: "inward" | "outward"; total_kg: number }[];
  const recent = (recentRes.data ?? []) as TransactionRow[];

  const inToday = todayTxns
    .filter((t) => t.type === "inward")
    .reduce((s, t) => s + Number(t.total_kg), 0);
  const outToday = todayTxns
    .filter((t) => t.type === "outward")
    .reduce((s, t) => s + Number(t.total_kg), 0);

  const setupNeeded = !!stockRes.error;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Rice stock overview · today is ${formatDate(td)}`}
        action={
          <Link href="/transactions" className="btn-primary">
            + New entry
          </Link>
        }
      />

      {setupNeeded && (
        <div className="card mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Database not set up yet?</p>
          <p className="mt-1">
            Run <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code>{" "}
            in your Supabase SQL editor. {stockRes.error?.message}
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard label="Rice in stock" value={`${num(stock.total_kg)} kg`} tone="brand" />
        <SummaryCard label="Inward today" value={`${num(inToday)} kg`} tone="green" />
        <SummaryCard label="Outward today" value={`${num(outToday)} kg`} tone="red" />
      </div>

      {/* Recent activity */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <Link href="/transactions" className="text-sm text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-gray-50">
          {recent.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.type === "inward"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {t.type}
                </span>
                <span className="font-medium text-gray-900">
                  {t.dealers?.name ?? "—"}
                </span>
                <span className="text-gray-400">· {weightShort(t.kind, t.bag_weight_kg)}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className={t.type === "inward" ? "text-green-600" : "text-red-600"}>
                  {t.type === "inward" ? "+" : "-"}
                  {num(t.quantity)} {t.kind === "bag" ? "bags" : "kg"}
                </span>
                <span className="w-24 text-right text-xs text-gray-400">
                  {formatDate(t.txn_date)}
                </span>
              </div>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="px-5 py-8 text-center text-gray-400">
              No transactions yet. Add your first entry.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "brand" | "green" | "red";
}) {
  const tones = {
    brand: "text-brand-700",
    green: "text-green-600",
    red: "text-red-600",
  };
  return (
    <div className="card p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}
