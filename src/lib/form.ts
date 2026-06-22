export function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getNumber(formData: FormData, key: string) {
  const value = getField(formData, key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

export type FormState = {
  error?: string;
};
