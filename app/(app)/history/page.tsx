import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num, formatDateTime, formatDate, weightShort } from "@/lib/format";
import type { ActivityRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(300);

  const rows = (data ?? []) as ActivityRow[];

  return (
    <div>
      <PageHeader
        title="History"
        subtitle="Timestamped log of every entry added and removed"
      />

      {error && (
        <div className="card mb-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Couldn&apos;t load history. Have you run the latest{" "}
          <code className="rounded bg-amber-100 px-1">supabase/schema.sql</code>?{" "}
          {error.message}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Bill</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 font-medium">Dealer</th>
                <th className="px-5 py-3 font-medium">Item</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Total kg</th>
                <th className="px-5 py-3 font-medium">Entry date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="whitespace-nowrap px-5 py-3 text-gray-600">
                    {formatDateTime(r.at)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.action === "created"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {r.action === "created" ? "added" : "removed"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {r.bill_no != null ? `#${r.bill_no}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {r.txn_type && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.txn_type === "inward"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {r.txn_type}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {r.dealer_name ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-gray-600">
                    {r.kind ? weightShort(r.kind, r.bag_weight_kg) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {num(r.quantity)} {r.kind === "bag" ? "bags" : "kg"}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {num(r.total_kg)}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {r.txn_date ? formatDate(r.txn_date) : "—"}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-gray-400">
                    No activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
