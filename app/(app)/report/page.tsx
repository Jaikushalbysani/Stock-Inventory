import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/page-header";
import { num, formatDate, today, weightShort } from "@/lib/format";
import type { Kind } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Row {
  key: string;
  label: string;
  unit: string;
  opening: number;
  inward: number;
  outward: number;
  closing: number;
}

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const selected = date || today();

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("type, kind, bag_weight_kg, quantity, txn_date")
    .lte("txn_date", selected);

  const txns = (data ?? []) as {
    type: "inward" | "outward";
    kind: Kind;
    bag_weight_kg: number | null;
    quantity: number;
    txn_date: string;
  }[];

  // group into weight buckets (by kind + bag_weight_kg)
  const map = new Map<string, Row>();
  for (const t of txns) {
    const key = t.kind === "bag" ? `bag-${t.bag_weight_kg}` : "loose";
    if (!map.has(key)) {
      map.set(key, {
        key,
        label: weightShort(t.kind, t.bag_weight_kg),
        unit: t.kind === "bag" ? "bags" : "kg",
        opening: 0,
        inward: 0,
        outward: 0,
        closing: 0,
      });
    }
    const row = map.get(key)!;
    const q = Number(t.quantity);
    if (t.txn_date < selected) {
      row.opening += t.type === "inward" ? q : -q;
    } else if (t.txn_date === selected) {
      if (t.type === "inward") row.inward += q;
      else row.outward += q;
    }
  }

  const rows = [...map.values()]
    .map((r) => ({ ...r, closing: r.opening + r.inward - r.outward }))
    .sort((a, b) => a.key.localeCompare(b.key));

  return (
    <div>
      <PageHeader
        title="Daily Stock Report"
        subtitle={`Opening, inward, outward & closing per bag weight — ${formatDate(selected)}`}
        action={
          <form method="get" className="flex items-end gap-2">
            <div>
              <label className="label" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                name="date"
                type="date"
                defaultValue={selected}
                max={today()}
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary">
              View
            </button>
          </form>
        }
      />

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3 font-medium">Weight</th>
              <th className="px-5 py-3 text-right font-medium">Opening</th>
              <th className="px-5 py-3 text-right font-medium">Inward</th>
              <th className="px-5 py-3 text-right font-medium">Outward</th>
              <th className="px-5 py-3 text-right font-medium">Closing</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-gray-50 last:border-0">
                <td className="px-5 py-3 font-medium text-gray-900">{r.label}</td>
                <td className="px-5 py-3 text-right text-gray-600">
                  {num(r.opening)} {r.unit}
                </td>
                <td className="px-5 py-3 text-right text-green-600">
                  {r.inward ? `+${num(r.inward)}` : "—"}
                </td>
                <td className="px-5 py-3 text-right text-red-600">
                  {r.outward ? `-${num(r.outward)}` : "—"}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-gray-900">
                  {num(r.closing)} {r.unit}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                  No stock movement up to this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Closing = Opening + Inward − Outward. Opening carries forward the cumulative
        balance from all earlier days. Each bag weight is tracked separately.
      </p>
    </div>
  );
}
