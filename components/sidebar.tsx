"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  DashboardIcon,
  TransactionsIcon,
  InventoryIcon,
  ReportIcon,
  DealersIcon,
  HistoryIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/transactions", label: "Transactions", Icon: TransactionsIcon },
  { href: "/inventory", label: "Inventory", Icon: InventoryIcon },
  { href: "/report", label: "Daily Report", Icon: ReportIcon },
  { href: "/dealers", label: "Dealers", Icon: DealersIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-6">
        <h1 className="text-base font-bold leading-tight text-gray-900">
          Nandagopala
        </h1>
        <p className="text-sm font-medium text-brand-600">Rice Mill</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <p className="text-xs text-gray-400">Rice inventory · in kg</p>
      </div>
    </aside>
  );
}
