import { getField } from "@/lib/form";
import { isValidEwayBillNumber, normalizeEwayBillNumber } from "@/lib/eway-bill";

export function parseTransportFromForm(formData: FormData) {
  const ewayRaw = getField(formData, "ewayBillNumber");

  if (ewayRaw && !isValidEwayBillNumber(ewayRaw)) {
    return {
      error: "E-way bill number must be 12 digits from the government portal.",
    } as const;
  }

  return {
    data: {
      dispatchPlace: getField(formData, "dispatchPlace") || undefined,
      deliveryPlace: getField(formData, "deliveryPlace") || undefined,
      vehicleNumber: getField(formData, "vehicleNumber") || undefined,
      transporterName: getField(formData, "transporterName") || undefined,
      transporterGstin: getField(formData, "transporterGstin").toUpperCase() || undefined,
      ewayBillNumber: ewayRaw ? normalizeEwayBillNumber(ewayRaw) : undefined,
    },
  } as const;
}
