"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createDealer, type DealerState } from "./actions";

const initialState: DealerState = { error: null, ok: false };

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary w-full" disabled={pending}>
      {pending ? "Saving…" : "Add dealer"}
    </button>
  );
}

export default function DealerForm() {
  const [state, formAction] = useActionState(createDealer, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form ref={ref} action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">
          Dealer name
        </label>
        <input id="name" name="name" required className="input" placeholder="e.g. Sri Lakshmi Traders" />
      </div>

      <div>
        <label className="label" htmlFor="phone">
          Phone (optional)
        </label>
        <input id="phone" name="phone" className="input" placeholder="9XXXXXXXXX" />
      </div>

      <div>
        <label className="label" htmlFor="address">
          Address (optional)
        </label>
        <input id="address" name="address" className="input" placeholder="Town / city" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Dealer added.
        </p>
      )}

      <Submit />
    </form>
  );
}
