import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num, weightShort } from "@/lib/format";
import type { CurrentStock, DealerStockRow, StockByWeightRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const supabase = await createClient();
  const [bucketsRes, dealersRes, totalRes] = await Promise.all([
    supabase.from("stock_by_weight").select("*"),
    supabase.from("dealer_stock").select("*").order("dealer_name"),
    supabase.from("current_stock").select("*").single(),
  ]);

  const buckets = (bucketsRes.data ?? []) as StockByWeightRow[];
  const dealers = (dealersRes.data ?? []) as DealerStockRow[];
  const total = (totalRes.data ?? { total_bags: 0, total_kg: 0 }) as CurrentStock;

  // bags first (by weight asc), loose last
  const sorted = [...buckets].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "bag" ? -1 : 1;
    return Number(a.bag_weight_kg) - Number(b.bag_weight_kg);
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Live rice stock — updates automatically on every inward & outward"
      />

      {/* Totals */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total bags in stock</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">{num(total.total_bags)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total rice in stock</p>
          <p className="mt-1 text-3xl font-bold text-brand-700">
            {num(total.total_kg)} <span className="text-lg font-medium text-gray-400">kg</span>
          </p>
        </div>
      </div>

      {/* Stock by weight */}
      <div className="card mb-6 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Stock by bag weight</h2>
          <p className="text-xs text-gray-500">Balance = inward − outward</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">Weight</th>
                <th className="px-5 py-3 text-right font-medium">In</th>
                <th className="px-5 py-3 text-right font-medium">Out</th>
                <th className="px-5 py-3 text-right font-medium">Balance</th>
                <th className="px-5 py-3 text-right font-medium">Balance kg</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((b) => {
                const unit = b.kind === "bag" ? "bags" : "kg";
                return (
                  <tr
                    key={`${b.kind}-${b.bag_weight_kg}`}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {weightShort(b.kind, b.bag_weight_kg)}
                    </td>
                    <td className="px-5 py-3 text-right text-green-600">
                      {num(b.in_qty)} {unit}
                    </td>
                    <td className="px-5 py-3 text-right text-red-600">
                      {num(b.out_qty)} {unit}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">
                      {num(b.balance_qty)} {unit}
                    </td>
                    <td className="px-5 py-3 text-right text-gray-700">
                      {num(b.balance_kg)} kg
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                    No stock yet. Add an inward entry to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per dealer */}
      <div className="card overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">By dealer (total kg)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3 font-medium">Dealer</th>
                <th className="px-5 py-3 text-right font-medium">In (kg)</th>
                <th className="px-5 py-3 text-right font-medium">Out (kg)</th>
                <th className="px-5 py-3 text-right font-medium">Balance (kg)</th>
              </tr>
            </thead>
            <tbody>
              {dealers.map((d) => (
                <tr key={d.dealer_id} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.dealer_name}</td>
                  <td className="px-5 py-3 text-right text-green-600">{num(d.in_kg)}</td>
                  <td className="px-5 py-3 text-right text-red-600">{num(d.out_kg)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">
                    {num(d.balance_kg)}
                  </td>
                </tr>
              ))}
              {dealers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    No dealers yet.
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
