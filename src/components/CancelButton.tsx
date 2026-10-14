"use client";

import { cancelReservationAction } from "@/server/actions/reservations";
import { btnGhostCls } from "./ui";

export function CancelButton({ id }: { id: string }) {
  return (
    <form
      action={cancelReservationAction}
      onSubmit={(e) => {
        if (!confirm("Cancel this reservation?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={`${btnGhostCls} text-red-700`}>
        Cancel
      </button>
    </form>
  );
}
