"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num } from "@/lib/format";

export type TxnState = { error: string | null; ok: boolean; billNo?: number };

function revalidateAll() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/dealers");
  revalidatePath("/report");
  revalidatePath("/history");
}

export async function createTransaction(
  _prev: TxnState,
  formData: FormData
): Promise<TxnState> {
  const type = String(formData.get("type") || "");
  const dealer_id = String(formData.get("dealer_id") || "");
  const kind = String(formData.get("kind") || "bag");
  const quantity = parseFloat(String(formData.get("quantity") || ""));
  const txn_date = String(formData.get("txn_date") || "");
  const notes = String(formData.get("notes") || "").trim();

  const bagWeightRaw = String(formData.get("bag_weight_kg") || "").trim();
  const bag_weight_kg = kind === "bag" ? parseFloat(bagWeightRaw) : null;

  if (type !== "inward" && type !== "outward") {
    return { error: "Choose inward or outward.", ok: false };
  }
  if (!dealer_id) return { error: "Select a dealer.", ok: false };
  if (kind !== "bag" && kind !== "loose") {
    return { error: "Choose bags or loose.", ok: false };
  }
  if (kind === "bag" && (!bag_weight_kg || bag_weight_kg <= 0)) {
    return { error: "Enter the bag weight in kg.", ok: false };
  }
  if (!quantity || quantity <= 0) {
    return {
      error: kind === "bag" ? "Enter the number of bags." : "Enter kilograms.",
      ok: false,
    };
  }
  if (!txn_date) return { error: "Pick a date.", ok: false };

  const supabase = await createClient();

  // Outward: block if there isn't enough stock in the chosen bucket.
  if (type === "outward") {
    let q = supabase
      .from("transactions")
      .select("type, quantity")
      .eq("kind", kind);
    q = kind === "bag" ? q.eq("bag_weight_kg", bag_weight_kg) : q.is("bag_weight_kg", null);

    const { data: rows, error: stockErr } = await q;
    if (stockErr) return { error: stockErr.message, ok: false };

    const available = (rows ?? []).reduce(
      (s, r) => s + (r.type === "inward" ? Number(r.quantity) : -Number(r.quantity)),
      0
    );

    if (quantity > available) {
      const unitWord =
        kind === "bag" ? `bags of ${num(bag_weight_kg)} kg` : "kg (loose)";
      return {
        error: `Not enough stock. Only ${num(available)} ${unitWord} available.`,
        ok: false,
      };
    }
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({
      type,
      dealer_id,
      kind,
      bag_weight_kg,
      quantity,
      txn_date,
      notes: notes || null,
    })
    .select("*, dealers(name)")
    .single();

  if (error) return { error: error.message, ok: false };

  // Audit log
  await supabase.from("activity_log").insert({
    action: "created",
    transaction_id: inserted.id,
    bill_no: inserted.bill_no,
    txn_type: inserted.type,
    txn_date: inserted.txn_date,
    dealer_name: inserted.dealers?.name ?? null,
    kind: inserted.kind,
    bag_weight_kg: inserted.bag_weight_kg,
    quantity: inserted.quantity,
    total_kg: inserted.total_kg,
    notes: inserted.notes,
  });

  revalidateAll();
  return { error: null, ok: true, billNo: inserted.bill_no };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createClient();

  // Snapshot before deleting so the history survives.
  const { data: t } = await supabase
    .from("transactions")
    .select("*, dealers(name)")
    .eq("id", id)
    .single();

  await supabase.from("transactions").delete().eq("id", id);

  if (t) {
    await supabase.from("activity_log").insert({
      action: "deleted",
      transaction_id: null,
      bill_no: t.bill_no,
      txn_type: t.type,
      txn_date: t.txn_date,
      dealer_name: t.dealers?.name ?? null,
      kind: t.kind,
      bag_weight_kg: t.bag_weight_kg,
      quantity: t.quantity,
      total_kg: t.total_kg,
      notes: t.notes,
    });
  }

  revalidateAll();
}
