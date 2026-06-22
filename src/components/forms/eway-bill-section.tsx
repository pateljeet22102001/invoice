import { FormField } from "@/components/forms/form-fields";
import { EwayBillIntegrationComingSoon } from "@/components/eway-bill/integration-coming-soon";
import { EWAY_BILL_GOVT_PORTAL, formatEwayBillNumber } from "@/lib/eway-bill";

type EwayBillDefaults = {
  ewayBillNumber?: string | null;
  dispatchPlace?: string | null;
  deliveryPlace?: string | null;
  vehicleNumber?: string | null;
  transporterName?: string | null;
  transporterGstin?: string | null;
};

export function EwayBillSection({
  prefix = "",
  defaults = {},
  documentLabel = "invoice",
}: {
  prefix?: string;
  defaults?: EwayBillDefaults;
  documentLabel?: "invoice" | "challan";
}) {
  const id = (name: string) => (prefix ? `${prefix}${name}` : name);
  const linked = Boolean(defaults.ewayBillNumber?.trim());

  return (
    <div className="space-y-4">
      <EwayBillIntegrationComingSoon compact />

      <div
        className={`rounded-xl border p-4 ${
          linked
            ? "border-emerald-300 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              E-way Bill (Government of India)
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              E-way bill number comes from the{" "}
              <strong>GST government portal</strong> — not from this app. One
              e-way bill per {documentLabel}. After government generates it, add
              the number here. It will print on your {documentLabel} PDF.
            </p>
          </div>
          {linked && (
            <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
              Linked
            </span>
          )}
        </div>

        {linked && defaults.ewayBillNumber && (
          <p className="mt-3 font-mono text-lg font-bold text-emerald-800">
            {formatEwayBillNumber(defaults.ewayBillNumber)}
          </p>
        )}

        <div className="mt-4">
          <FormField
            label="E-way Bill Number (12 digits from government)"
            id={id("ewayBillNumber")}
            name={id("ewayBillNumber")}
            placeholder="123456789012"
            hint="Generate on GST portal → copy 12-digit number → paste here. Auto API coming soon."
            maxLength={14}
            defaultValue={defaults.ewayBillNumber ?? undefined}
            className="sm:col-span-2"
          />
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Until government API is connected, paste the number manually after
          generating on the GST portal.
        </p>
        <a
          href={EWAY_BILL_GOVT_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500"
        >
          Open GST E-way Bill Portal →
        </a>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Transport Details</h3>
        <p className="mt-1 text-xs text-slate-500">
          Required for e-way bill on government portal — also shown on {documentLabel}.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField
            label="Dispatch From"
            id={id("dispatchPlace")}
            placeholder="Your godown / shop"
            defaultValue={defaults.dispatchPlace ?? undefined}
          />
          <FormField
            label="Delivery To"
            id={id("deliveryPlace")}
            placeholder="Receiver address"
            defaultValue={defaults.deliveryPlace ?? undefined}
          />
          <FormField
            label="Vehicle Number"
            id={id("vehicleNumber")}
            placeholder="MH 12 AB 1234"
            defaultValue={defaults.vehicleNumber ?? undefined}
          />
          <FormField
            label="Transporter Name"
            id={id("transporterName")}
            placeholder="ABC Logistics"
            defaultValue={defaults.transporterName ?? undefined}
          />
          <FormField
            label="Transporter GSTIN"
            id={id("transporterGstin")}
            placeholder="27AAAAA0000A1Z5"
            maxLength={15}
            defaultValue={defaults.transporterGstin ?? undefined}
            className="sm:col-span-2"
          />
        </div>
      </div>
    </div>
  );
}
