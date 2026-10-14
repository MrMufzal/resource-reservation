"use client";

import { useActionState } from "react";
import { createResourceAction } from "@/server/actions/resources";
import type { FormState } from "@/lib/form";
import { Field } from "./Field";
import { btnCls, inputCls } from "./ui";

export function ResourceForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createResourceAction,
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
      <Field label="Name" error={fe.name}>
        <input name="name" defaultValue={v.name} className={inputCls} />
      </Field>
      <Field label="Category" error={fe.category}>
        <input name="category" list="categories" defaultValue={v.category} placeholder="Meeting Room, Vehicle, Equipment…" className={inputCls} />
        <datalist id="categories">
          <option value="Meeting Room" />
          <option value="Vehicle" />
          <option value="Equipment" />
        </datalist>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Capacity (optional)" error={fe.capacity}>
          <input name="capacity" type="number" min={1} defaultValue={v.capacity} className={inputCls} />
        </Field>
        <Field label="Location (optional)" error={fe.location}>
          <input name="location" defaultValue={v.location} className={inputCls} />
        </Field>
      </div>
      <Field label="Description (optional)" error={fe.description}>
        <textarea name="description" defaultValue={v.description} rows={3} className={inputCls} />
      </Field>
      <button type="submit" disabled={pending} className={btnCls}>
        {pending ? "Saving…" : "Add resource"}
      </button>
    </form>
  );
}
