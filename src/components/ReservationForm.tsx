"use client";

import { useActionState } from "react";
import { createReservationAction } from "@/server/actions/reservations";
import type { FormState } from "@/lib/form";
import { Field } from "./Field";
import { btnCls, inputCls } from "./ui";

type Props = {
  resources: { id: string; name: string; category: string }[];
  defaults: { resourceId: string; startsAt: string; endsAt: string };
};

export function ReservationForm({ resources, defaults }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createReservationAction,
    {},
  );
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="max-w-xl space-y-4">
      {state.error && (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <Field label="Resource" error={fe.resourceId}>
        <select name="resourceId" defaultValue={v.resourceId ?? defaults.resourceId} className={inputCls}>
          <option value="">Select a resource…</option>
          {resources.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.category})
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" error={fe.startsAt}>
          <input type="datetime-local" name="startsAt" defaultValue={v.startsAt ?? defaults.startsAt} className={inputCls} />
        </Field>
        <Field label="Ends" error={fe.endsAt}>
          <input type="datetime-local" name="endsAt" defaultValue={v.endsAt ?? defaults.endsAt} className={inputCls} />
        </Field>
      </div>

      <Field label="Title" error={fe.title}>
        <input name="title" defaultValue={v.title} placeholder="e.g. Sprint planning" className={inputCls} />
      </Field>

      <Field label="Reserved by" error={fe.reservedBy}>
        <input name="reservedBy" defaultValue={v.reservedBy} placeholder="Your name" className={inputCls} />
      </Field>

      <Field label="Notes (optional)" error={fe.notes}>
        <textarea name="notes" defaultValue={v.notes} rows={3} className={inputCls} />
      </Field>

      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Reserving…" : "Reserve"}
      </button>
    </form>
  );
}
