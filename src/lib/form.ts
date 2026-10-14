export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string[]>>;
  values?: Record<string, string>;
};

/** FormData -> plain string record (drops File entries). */
export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

/** Treat blank inputs as "not provided" so optional fields validate. */
export function blankToUndefined(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, v.trim() === "" ? undefined : v]),
  );
}
