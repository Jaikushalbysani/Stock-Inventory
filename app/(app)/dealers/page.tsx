import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num } from "@/lib/format";
import type { Dealer, DealerStockRow } from "@/lib/types";
import DealerForm from "./dealer-form";
import { deleteDealer } from "./actions";

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const supabase = await createClient();
  const [dealersRes, stockRes] = await Promise.all([
    supabase.from("dealers").select("*").order("name"),
    supabase.from("dealer_stock").select("*"),
  ]);

  const dealers = (dealersRes.data ?? []) as Dealer[];
  const stock = (stockRes.data ?? []) as DealerStockRow[];
  const stockById = new Map(stock.map((s) => [s.dealer_id, s]));

  return (
    <div>
      <PageHeader
        title="Dealers"
        subtitle="One shared dealer list — used for both inward and outward"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card h-fit p-5">
          <h2 className="mb-4 font-semibold text-gray-900">Add dealer</h2>
          <DealerForm />
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
            <h2 className="font-semibold text-gray-900">All dealers</h2>
            <span className="text-xs text-gray-400">{dealers.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 text-right font-medium">Balance (kg)</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {dealers.map((d) => {
                  const s = stockById.get(d.id);
                  return (
                    <tr key={d.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-900">{d.name}</div>
                        {d.address && (
                          <div className="text-xs text-gray-400">{d.address}</div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">{d.phone ?? "—"}</td>
                      <td className="px-5 py-3 text-right font-semibold text-gray-900">
                        {num(s?.balance_kg ?? 0)} kg
                      </td>
                      <td className="px-5 py-3 text-right">
                        <form action={deleteDealer}>
                          <input type="hidden" name="id" value={d.id} />
                          <button
                            type="submit"
                            className="text-xs text-gray-400 hover:text-red-600"
                            title="Delete (only if no transactions)"
                          >
                            ✕
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
                {dealers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                      No dealers yet. Add your first one.
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
