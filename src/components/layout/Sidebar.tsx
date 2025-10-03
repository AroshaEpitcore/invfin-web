"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  DollarSign,
  FileText,
  Settings,
  Users,
  Package,
  Receipt,
  Wallet,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { Tooltip } from "react-tooltip"; // react-tooltip v4+

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/stocks", label: "Stocks", icon: Package },
  { href: "/sales", label: "Sales", icon: Receipt },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/finance", label: "Finance", icon: DollarSign },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/users", label: "Users", icon: Users },
  { href: "/whatsapp", label: "Whatsapp", icon: MessageCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();

  return (
    <aside
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-[#0b1220] flex flex-col transition-all duration-300 ease-in-out`}
    >
      <div className="p-4 text-gray-100 font-bold text-xl flex items-center justify-center">
        {collapsed ? <ChevronRight className="h-6 w-6" /> : "InvFin"}
      </div>

      <nav className="flex-1">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            const linkClasses = `flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
              active
                ? "bg-gray-700 text-primary"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`;

            return (
              <li key={item.href}>
                {collapsed ? (
                  <>
                    <Link
                      href={item.href}
                      className={`${linkClasses} justify-center`}
                      data-tooltip-id={`tooltip-${item.href}`}
                      data-tooltip-content={item.label}
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                    <Tooltip
                      id={`tooltip-${item.href}`}
                      place="right"
                      className="bg-black text-white px-2 py-1 rounded text-sm"
                    />
                  </>
                ) : (
                  <Link href={item.href} className={linkClasses}>
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
