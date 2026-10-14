import { format } from "date-fns";

export const fmtDateTime = (d: Date) => format(d, "EEE d MMM, HH:mm");
export const fmtTime = (d: Date) => format(d, "HH:mm");
export const fmtRange = (a: Date, b: Date) =>
  `${format(a, "EEE d MMM, HH:mm")} – ${format(b, "HH:mm")}`;
