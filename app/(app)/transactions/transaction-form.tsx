"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createTransaction, type TxnState } from "./actions";
import { num, today, weightShort } from "@/lib/format";
import type { Dealer, Kind, StockByWeightRow } from "@/lib/types";

const initialState: TxnState = { error: null, ok: false };

function Submit({ type }: { type: "inward" | "outward" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn w-full text-white ${
        type === "inward"
          ? "bg-green-600 hover:bg-green-700"
          : "bg-red-600 hover:bg-red-700"
      }`}
      disabled={pending}
    >
      {pending ? "Saving…" : type === "inward" ? "Add inward (rice in)" : "Record outward (rice out)"}
    </button>
  );
}

export default function TransactionForm({
  dealers,
  buckets,
}: {
  dealers: Dealer[];
  buckets: StockByWeightRow[];
}) {
  const [type, setType] = useState<"inward" | "outward">("inward");
  const [kind, setKind] = useState<Kind>("bag");
  const [outWeight, setOutWeight] = useState<string>("");
  const [state, formAction] = useActionState(createTransaction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOutWeight("");
    }
  }, [state.ok]);

  const bagBuckets = buckets.filter(
    (b) => b.kind === "bag" && Number(b.balance_qty) > 0
  );
  const looseBucket = buckets.find((b) => b.kind === "loose");
  const looseAvail = looseBucket ? Number(looseBucket.balance_qty) : 0;

  const selectedAvail =
    type === "outward" && kind === "bag"
      ? Number(
          bagBuckets.find((b) => String(b.bag_weight_kg) === outWeight)
            ?.balance_qty ?? 0
        )
      : looseAvail;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="kind" value={kind} />

      {/* Inward / outward */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
        {(["inward", "outward"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md py-2 text-sm font-semibold capitalize transition-colors ${
              type === t
                ? t === "inward"
                  ? "bg-white text-green-700 shadow-sm"
                  : "bg-white text-red-700 shadow-sm"
                : "text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Dealer */}
      <div>
        <label className="label" htmlFor="dealer_id">
          Dealer <span className="text-red-500">*</span>
        </label>
        <select id="dealer_id" name="dealer_id" required className="input" defaultValue="">
          <option value="" disabled>
            Select dealer…
          </option>
          {dealers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {dealers.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">
            No dealers yet — add one on the Dealers page first.
          </p>
        )}
      </div>

      {/* Bag / loose */}
      <div>
        <label className="label">Type</label>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
          {(["bag", "loose"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                kind === k ? "bg-white text-brand-700 shadow-sm" : "text-gray-500"
              }`}
            >
              {k === "bag" ? "Weighed bags" : "Loose (kg)"}
            </button>
          ))}
        </div>
      </div>

      {/* INWARD bag: free weight + qty.  OUTWARD bag: pick existing weight + qty */}
      {kind === "bag" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="bag_weight_kg">
              Bag weight (kg)
            </label>
            {type === "inward" ? (
              <input
                id="bag_weight_kg"
                name="bag_weight_kg"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="input"
                placeholder="e.g. 25"
              />
            ) : (
              <select
                id="bag_weight_kg"
                name="bag_weight_kg"
                required
                className="input"
                value={outWeight}
                onChange={(e) => setOutWeight(e.target.value)}
              >
                <option value="" disabled>
                  Select…
                </option>
                {bagBuckets.map((b) => (
                  <option key={String(b.bag_weight_kg)} value={String(b.bag_weight_kg)}>
                    {weightShort(b.kind, b.bag_weight_kg)} ({num(b.balance_qty)} in stock)
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label" htmlFor="quantity">
              No. of bags
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="1"
              min="1"
              required
              className="input"
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* loose: kg only */}
      {kind === "loose" && (
        <div>
          <label className="label" htmlFor="quantity">
            Quantity (kg)
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="input"
            placeholder="e.g. 22"
          />
        </div>
      )}

      {type === "outward" && (
        <p className="text-xs text-gray-500">
          Available:{" "}
          <span className="font-medium text-gray-700">
            {num(selectedAvail)} {kind === "bag" ? "bags" : "kg"}
          </span>
        </p>
      )}

      {/* Date + notes */}
      <div>
        <label className="label" htmlFor="txn_date">
          Date
        </label>
        <input
          id="txn_date"
          name="txn_date"
          type="date"
          required
          defaultValue={today()}
          className="input"
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes (optional)
        </label>
        <input id="notes" name="notes" type="text" className="input" placeholder="Vehicle no, lot, etc." />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && state.billNo != null && (
        <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <span>Saved — Bill #{state.billNo}</span>
          <Link
            href={`/bill/${state.billNo}`}
            target="_blank"
            className="font-medium underline"
          >
            Print bill ↗
          </Link>
        </div>
      )}

      <Submit type={type} />
    </form>
  );
}
