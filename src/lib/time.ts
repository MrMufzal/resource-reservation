import { endOfDay, startOfDay } from "date-fns";

/** Start/end of the local day containing `date` (server time zone). */
export function dayRange(date: Date) {
  return { from: startOfDay(date), to: endOfDay(date) };
}

/** Value for <input type="datetime-local"> in local time. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
