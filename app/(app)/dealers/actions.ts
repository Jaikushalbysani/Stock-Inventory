"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DealerState = { error: string | null; ok: boolean };

export async function createDealer(
  _prev: DealerState,
  formData: FormData
): Promise<DealerState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const address = String(formData.get("address") || "").trim();

  if (!name) return { error: "Dealer name is required.", ok: false };

  const supabase = await createClient();
  const { error } = await supabase.from("dealers").insert({
    name,
    phone: phone || null,
    address: address || null,
  });

  if (error) return { error: error.message, ok: false };

  revalidatePath("/dealers");
  revalidatePath("/transactions");
  revalidatePath("/inventory");
  return { error: null, ok: true };
}

export async function deleteDealer(formData: FormData): Promise<void> {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const supabase = await createClient();
  // Will fail (and be ignored) if the dealer has transactions — by design,
  // so historical stock movements are never orphaned.
  await supabase.from("dealers").delete().eq("id", id);

  revalidatePath("/dealers");
  revalidatePath("/inventory");
}
