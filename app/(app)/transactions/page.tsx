import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num, formatDate, weightShort } from "@/lib/format";
import type { Dealer, StockByWeightRow, TransactionRow } from "@/lib/types";
import TransactionForm from "./transaction-form";
import { deleteTransaction } from "./actions";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, dealers(name, phone, address)")
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (type === "inward" || type === "outward") {
    query = query.eq("type", type);
  }

  const [txnRes, dealersRes, bucketsRes] = await Promise.all([
    query,
    supabase.from("dealers").select("*").order("name"),
    supabase.from("stock_by_weight").select("*"),
  ]);

  const txns = (txnRes.data ?? []) as TransactionRow[];
  const dealers = (dealersRes.data ?? []) as Dealer[];
  const buckets = (bucketsRes.data ?? []) as StockByWeightRow[];

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Record rice inward & outward against a dealer"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-gray-900">New entry</h2>
          <TransactionForm dealers={dealers} buckets={buckets} />
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
            <FilterTab label="All" href="/transactions" active={!type} />
            <FilterTab label="Inward" href="/transactions?type=inward" active={type === "inward"} />
            <FilterTab label="Outward" href="/transactions?type=outward" active={type === "outward"} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3 font-medium">Bill</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Dealer</th>
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Total kg</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 text-gray-500">#{t.bill_no}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDate(t.txn_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.type === "inward"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {t.dealers?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {weightShort(t.kind, t.bag_weight_kg)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        t.type === "inward" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "inward" ? "+" : "-"}
                      {num(t.quantity)} {t.kind === "bag" ? "bags" : "kg"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {num(t.total_kg)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/bill/${t.bill_no}`}
                          target="_blank"
                          className="text-xs text-brand-600 hover:underline"
                          title="Print bill"
                        >
                          Bill
                        </Link>
                        <form action={deleteTransaction}>
                          <input type="hidden" name="id" value={t.id} />
                          <button
                            type="submit"
                            className="text-xs text-gray-400 hover:text-red-600"
                            title="Delete"
                          >
                            ✕
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {txns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterTab({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-brand-50 text-brand-700" : "text-gray-500 hover:bg-gray-50"
      }`}
    >
      {label}
    </a>
  );
}
