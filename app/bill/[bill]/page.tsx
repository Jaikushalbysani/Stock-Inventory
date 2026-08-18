import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { num, formatDate, formatDateTime, weightLabel } from "@/lib/format";
import type { TransactionRow } from "@/lib/types";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

export default async function BillPage({
  params,
}: {
  params: Promise<{ bill: string }>;
}) {
  const { bill } = await params;
  const billNo = parseInt(bill, 10);
  if (Number.isNaN(billNo)) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, dealers(name, phone, address)")
    .eq("bill_no", billNo)
    .single();

  if (!data) notFound();
  const t = data as TransactionRow;

  const isIn = t.type === "inward";
  const qtyLabel = t.kind === "bag" ? "bags" : "kg";

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-black print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <PrintButton />

        <div className="border-2 border-black bg-white p-8 print:border print:p-6">
          {/* Header */}
          <div className="border-b-2 border-black pb-4 text-center">
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Nandagopala Rice Mill
            </h1>
            <p className="mt-1 text-xs uppercase tracking-widest text-gray-600">
              Stock {isIn ? "Inward" : "Outward"} Memo
            </p>
          </div>

          {/* Bill meta */}
          <div className="flex justify-between border-b border-black py-3 text-sm">
            <div>
              <span className="text-gray-600">Bill No: </span>
              <span className="font-semibold">#{t.bill_no}</span>
            </div>
            <div>
              <span className="text-gray-600">Date: </span>
              <span className="font-semibold">{formatDate(t.txn_date)}</span>
            </div>
            <div>
              <span className="text-gray-600">Type: </span>
              <span className="font-semibold uppercase">{t.type}</span>
            </div>
          </div>

          {/* Dealer */}
          <div className="border-b border-black py-3 text-sm">
            <p className="mb-1 text-xs uppercase tracking-wide text-gray-600">
              {isIn ? "Received from" : "Issued to"} (Dealer)
            </p>
            <p className="text-base font-semibold">{t.dealers?.name ?? "—"}</p>
            {t.dealers?.phone && <p>Phone: {t.dealers.phone}</p>}
            {t.dealers?.address && <p>{t.dealers.address}</p>}
          </div>

          {/* Line item */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-black text-left">
                <th className="py-2 pr-2 font-semibold">Product</th>
                <th className="py-2 px-2 font-semibold">Pack</th>
                <th className="py-2 px-2 text-right font-semibold">Quantity</th>
                <th className="py-2 px-2 text-right font-semibold">Wt/bag</th>
                <th className="py-2 pl-2 text-right font-semibold">Total kg</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="py-3 pr-2">Rice</td>
                <td className="py-3 px-2">{weightLabel(t.kind, t.bag_weight_kg)}</td>
                <td className="py-3 px-2 text-right">
                  {num(t.quantity)} {qtyLabel}
                </td>
                <td className="py-3 px-2 text-right">
                  {t.kind === "bag" ? `${num(t.bag_weight_kg)} kg` : "—"}
                </td>
                <td className="py-3 pl-2 text-right font-semibold">
                  {num(t.total_kg)} kg
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-b-2 border-black">
                <td colSpan={4} className="py-3 pr-2 text-right font-bold uppercase">
                  Total
                </td>
                <td className="py-3 pl-2 text-right font-bold">
                  {num(t.total_kg)} kg
                </td>
              </tr>
            </tfoot>
          </table>

          {t.notes && (
            <p className="border-b border-black py-3 text-sm">
              <span className="text-gray-600">Notes: </span>
              {t.notes}
            </p>
          )}

          {/* Signatures */}
          <div className="mt-12 flex justify-between text-sm">
            <div className="text-center">
              <div className="w-40 border-t border-black pt-1">Dealer Signature</div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-black pt-1">
                For Nandagopala Rice Mill
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-gray-500">
            Generated {formatDateTime(t.created_at)} · Computer-generated memo
          </p>
        </div>
      </div>
    </main>
  );
}
