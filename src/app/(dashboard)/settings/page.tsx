import { Header } from "@/components/layout/header";
import { PageShell } from "@/app/(dashboard)/layout";
import { BusinessTypeForm } from "@/components/forms/business-type-form";
import { BusinessProfileForm } from "@/components/forms/business-profile-form";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { getBusinessTypeLabel } from "@/lib/constants/business-types";
import type { Business } from "@/types/models";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { businessId, userName, email } = await requireBusiness();

  const business = (await prisma.business.findUnique({
    where: { id: businessId },
  })) as Business | null;

  const isApmc = business?.businessType === "APMC_COMMISSION";
  const hasLicense = Boolean(business?.licenseNumber);

  return (
    <>
      <Header
        title="Settings"
        description="Business profile and Indian tax details"
      />
      <PageShell>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Account</h2>
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">Name</dt>
                <dd className="mt-1 text-base text-slate-900">{userName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-base text-slate-900">{email}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Business Profile
            </h2>
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Business Type
                </dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.businessType
                    ? getBusinessTypeLabel(business.businessType)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  Company / Firm Name
                </dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.name ?? "—"}
                </dd>
              </div>
              {business?.tradeName && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Trade Name
                  </dt>
                  <dd className="mt-1 text-base text-slate-900">
                    {business.tradeName}
                  </dd>
                </div>
              )}
              {isApmc && business?.apmcMarketName && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    APMC Market
                  </dt>
                  <dd className="mt-1 text-base text-slate-900">
                    {business.apmcMarketName}
                  </dd>
                </div>
              )}
              {isApmc && business?.commissionRate != null && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    Default Commission Rate
                  </dt>
                  <dd className="mt-1 text-base text-slate-900">
                    {business.commissionRate}%
                  </dd>
                </div>
              )}
              {hasLicense && (
                <div>
                  <dt className="text-sm font-medium text-slate-500">
                    License Number
                  </dt>
                  <dd className="mt-1 text-base text-slate-900">
                    {business?.licenseNumber}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-slate-500">Phone</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.phone ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Address</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.address ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">
                  City / State / Pincode
                </dt>
                <dd className="mt-1 text-base text-slate-900">
                  {[business?.city, business?.state, business?.pincode]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">GSTIN</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.gstin ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">PAN</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.pan ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Currency</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {business?.currency ?? "INR"}
                </dd>
              </div>
            </dl>

            <BusinessProfileForm
              tradeName={business?.tradeName}
              phone={business?.phone}
              address={business?.address}
              city={business?.city}
              state={business?.state}
              pincode={business?.pincode}
              apmcMarketName={business?.apmcMarketName}
            />

            <BusinessTypeForm
              businessType={business?.businessType ?? "GENERAL_TRADING"}
              licenseNumber={business?.licenseNumber}
            />
          </div>
        </div>
      </PageShell>
    </>
  );
}
