import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/ui/stat-card";
import { PageShell } from "@/app/(dashboard)/layout";
import { usesTraderWorkflow } from "@/lib/constants/trader-workflow";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import type {
  InventoryWithProduct,
  InvoiceStatsByStatus,
  InvoiceWithCustomer,
} from "@/types/models";
import { formatCurrency } from "@/lib/utils";
import { formatQuantityWithUnit } from "@/lib/constants/product-units";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { businessId } = await requireBusiness();

  const [
    business,
    productCount,
    customerCount,
    invoiceStats,
    inventoryItems,
    recentInvoices,
  ] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { businessType: true },
    }),
    prisma.product.count({ where: { businessId } }),
    prisma.customer.count({ where: { businessId } }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { status: true },
      _sum: { total: true },
    }),
    prisma.inventory.findMany({
      where: { product: { businessId } },
      include: { product: true },
    }),
    prisma.invoice.findMany({
      where: { businessId },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    }),
  ]);

  const traderMode = usesTraderWorkflow(business?.businessType ?? "GENERAL_TRADING");
  const typedInventoryItems = inventoryItems as InventoryWithProduct[];
  const typedRecentInvoices = recentInvoices as InvoiceWithCustomer[];
  const typedInvoiceStats = invoiceStats as InvoiceStatsByStatus[];

  const lowStockItems = typedInventoryItems
    .filter((item) => item.quantity <= item.lowStockThreshold)
    .slice(0, 5);

  const paidTotal =
    typedInvoiceStats.find((s) => s.status === "PAID")?._sum.total ?? 0;
  const pendingCount = typedInvoiceStats
    .filter((s) => s.status === "SENT" || s.status === "OVERDUE")
    .reduce((sum, s) => sum + s._count.status, 0);

  const totalStockKg = typedInventoryItems
    .filter((item) => item.product.unit === "kg")
    .reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Header
        title="Dashboard"
        description={
          traderMode
            ? "Purchase stock → sell → check party ledger"
            : "Overview of your invoices, inventory, and GST billing"
        }
      />
      <PageShell>
        {traderMode && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/purchases/new"
              className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-6 transition hover:border-emerald-400 hover:bg-emerald-100"
            >
              <p className="text-lg font-bold text-emerald-900">1. Purchase Stock</p>
              <p className="mt-1 text-sm text-emerald-800">
                Purchase Bill — from farmer or APMC market. Type item name here.
              </p>
            </Link>
            <Link
              href="/invoices/new"
              className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-6 transition hover:border-indigo-400 hover:bg-indigo-100"
            >
              <p className="text-lg font-bold text-indigo-900">2. Sales Bill</p>
              <p className="mt-1 text-sm text-indigo-800">
                Sell to trader — stock goes down.
              </p>
            </Link>
            <Link
              href="/inventory"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <p className="text-lg font-bold text-slate-900">Stock</p>
              <p className="mt-1 text-2xl font-semibold text-slate-800">
                {formatQuantityWithUnit(totalStockKg, "kg")}
              </p>
              <p className="mt-1 text-xs text-slate-500">{productCount} item(s) in list</p>
            </Link>
            <Link
              href="/khata"
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <p className="text-lg font-bold text-slate-900">Party Ledger</p>
              <p className="mt-1 text-sm text-slate-600">Receivables and payables with parties</p>
            </Link>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={traderMode ? "Sales received" : "Total Revenue"}
            value={formatCurrency(paidTotal)}
            hint={traderMode ? "Paid sales bills (INR)" : "From paid invoices (INR)"}
            tone="success"
          />
          <StatCard
            label={traderMode ? "Items in list" : "Products"}
            value={String(productCount)}
            hint={traderMode ? "From purchase bills" : "Active product catalog"}
          />
          <StatCard
            label="Customers"
            value={String(customerCount)}
            hint="Buyer parties"
          />
          <StatCard
            label={traderMode ? "Pending sales" : "Pending Invoices"}
            value={String(pendingCount)}
            hint="Sent or overdue"
            tone={pendingCount > 0 ? "warning" : "default"}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {traderMode ? "Recent sales" : "Recent Invoices"}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {typedRecentInvoices.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">
                  {traderMode ? (
                    <>
                      No sales yet.{" "}
                      <Link href="/purchases/new" className="font-medium text-indigo-600 hover:underline">
                        Purchase stock
                      </Link>{" "}
                      first, then sell.
                    </>
                  ) : (
                    "No invoices yet. Create your first GST invoice to get started."
                  )}
                </p>
              ) : (
                typedRecentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-slate-500">
                        {invoice.customer.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-slate-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {traderMode ? "Low stock items" : "Low Stock Alerts"}
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {lowStockItems.length === 0 ? (
                <p className="px-6 py-8 text-sm text-slate-500">
                  {traderMode
                    ? "Stock OK — or buy more on Purchase Bill."
                    : "All products are above their low-stock threshold."}
                </p>
              ) : (
                lowStockItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {item.product.name}
                      </p>
                      {item.product.unit !== "kg" && (
                        <p className="text-sm text-slate-500">
                          SKU: {item.product.sku}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-rose-600">
                        {formatQuantityWithUnit(item.quantity, item.product.unit)} left
                      </p>
                      <p className="text-xs text-slate-400">
                        Alert at {formatQuantityWithUnit(item.lowStockThreshold, item.product.unit)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </PageShell>
    </>
  );
}
