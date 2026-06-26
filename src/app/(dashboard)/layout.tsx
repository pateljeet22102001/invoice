import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessName, userName, businessId } = await requireBusiness();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessType: true },
  });

  return (
    <DashboardShell
      businessName={businessName}
      userName={userName ?? "User"}
      businessType={business?.businessType ?? "GENERAL_TRADING"}
    >
      {children}
    </DashboardShell>
  );
}

export function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
    >
      {children}
    </Link>
  );
}

export function PageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">{children}</main>;
}
