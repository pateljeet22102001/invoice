"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  FileText,
  Users,
  Settings,
  BarChart3,
  Truck,
  Route,
  Receipt,
  BookOpen,
  LogOut,
  ScrollText,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { BRAND } from "@/lib/constants/brand";
import { usesTraderWorkflow } from "@/lib/constants/trader-workflow";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const retailNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/purchases", label: "Purchase Bills", icon: ShoppingCart },
  { href: "/khata", label: "Party Ledger", icon: ScrollText },
  { href: "/challans", label: "Delivery Challans", icon: Truck },
  { href: "/accounting", label: "Accounting", icon: BookOpen },
  { href: "/eway-bill", label: "E-way Bill", icon: Route, badge: "Soon" },
  { href: "/reports", label: "GST Reports", icon: BarChart3 },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/suppliers", label: "Suppliers", icon: UserPlus },
  { href: "/settings", label: "Settings", icon: Settings },
];

const traderPrimaryNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/purchases", label: "Purchase Stock", icon: ShoppingCart },
  { href: "/invoices", label: "Sales Bill", icon: FileText },
  { href: "/inventory", label: "Stock", icon: Warehouse },
  { href: "/khata", label: "Party Ledger", icon: ScrollText },
];

const traderMoreNav: NavItem[] = [
  { href: "/products", label: "Item List", icon: Package },
  { href: "/suppliers", label: "Suppliers", icon: UserPlus },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/challans", label: "Delivery Challans", icon: Truck },
  { href: "/accounting", label: "Accounting", icon: BookOpen },
  { href: "/reports", label: "GST Reports", icon: BarChart3 },
  { href: "/eway-bill", label: "E-way Bill", icon: Route, badge: "Soon" },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  businessName: string;
  userName: string;
  businessType?: string;
  mobileOpen?: boolean;
  onNavigate?: () => void;
}

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  pathname,
  onNavigate,
}: NavItem & { pathname: string; onNavigate?: () => void }) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-indigo-500/20 text-indigo-300"
          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge && (
        <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-300">
          {badge}
        </span>
      )}
    </Link>
  );
}

export function Sidebar({
  businessName,
  userName,
  businessType = "GENERAL_TRADING",
  mobileOpen = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const traderMode = usesTraderWorkflow(businessType);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,16rem)] flex-col border-r border-slate-200 bg-slate-950 text-slate-100 transition-transform duration-200 ease-out lg:static lg:z-auto lg:w-64 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      <div className="flex items-center gap-3 border-b border-slate-800 px-6 py-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">{BRAND.name}</p>
            <p className="text-xs text-slate-400">
              {traderMode ? "Purchase · Sales · Ledger" : "GST & Billing"}
            </p>
          </div>
        </Link>
      </div>

      <div className="border-b border-slate-800 px-6 py-4">
        <p className="truncate text-sm font-medium text-white">{businessName}</p>
        <p className="truncate text-xs text-slate-400">{userName}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {traderMode ? (
          <>
            {traderPrimaryNav.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
            ))}
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
              More
            </p>
            {traderMoreNav.map((item) => (
              <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
            ))}
          </>
        ) : (
          retailNav.map((item) => (
            <NavLink key={item.href} {...item} pathname={pathname} onNavigate={onNavigate} />
          ))
        )}
      </nav>

      <div className="border-t border-slate-800 px-3 py-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
