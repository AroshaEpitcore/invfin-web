"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getDashboardStats } from "./actions";
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Boxes,
  ShoppingCart,
  Banknote,
} from "lucide-react";

type DashboardStats = {
  TotalStock: number;
  TodaysSales: number;
  ThisMonthSales: number;
  ThisMonthProfit: number;
  UnitsSoldToday: number;
  UnitsSoldMonth: number;
  ExpensesMonth: number;
  ThisMonthNet: number;
  AllTimeSales: number;
  AllTimeProfit: number;
  Products: number;
  Variants: number;
  LowStock: number;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (e: any) {
        toast.error(e.message || "Failed to load dashboard stats");
      }
    })();
  }, []);

  return (
    <div className="text-gray-900 dark:text-white">
      <Toaster position="top-right" />
      <h1 className="text-xl font-bold mb-8 flex items-center gap-2">
        <Package className="w-7 h-7 text-primary" />
        Dashboard
      </h1>

      {!stats ? (
        <p className="text-gray-500 text-center py-12">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card
            title="Total Stock (pcs)"
            value={stats.TotalStock}
            icon={<Boxes className="w-5 h-5" />}
            color="bg-blue-500/20 text-blue-600 dark:text-blue-400"
          />
          <Card
            title="Today's Sales"
            value={`Rs ${stats.TodaysSales}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="bg-green-500/20 text-green-600 dark:text-green-400"
          />
          <Card
            title="This Month Sales"
            value={`Rs ${stats.ThisMonthSales}`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="bg-green-500/20 text-green-600 dark:text-green-400"
          />
          <Card
            title="This Month Profit"
            value={`Rs ${stats.ThisMonthProfit}`}
            icon={<Banknote className="w-5 h-5" />}
            color="bg-purple-500/20 text-purple-600 dark:text-purple-400"
          />
          <Card
            title="Units Sold Today"
            value={stats.UnitsSoldToday}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="bg-orange-500/20 text-orange-600 dark:text-orange-400"
          />
          <Card
            title="Units Sold (Month)"
            value={stats.UnitsSoldMonth}
            icon={<ShoppingCart className="w-5 h-5" />}
            color="bg-orange-500/20 text-orange-600 dark:text-orange-400"
          />
          <Card
            title="Expenses (Month)"
            value={`Rs ${stats.ExpensesMonth}`}
            icon={<TrendingDown className="w-5 h-5" />}
            color="bg-red-500/20 text-red-600 dark:text-red-400"
          />
          <Card
            title="This Month Net"
            value={`Rs ${stats.ThisMonthNet}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="bg-teal-500/20 text-teal-600 dark:text-teal-400"
          />
          <Card
            title="All-time Sales"
            value={`Rs ${stats.AllTimeSales}`}
            icon={<DollarSign className="w-5 h-5" />}
            color="bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"
          />
          <Card
            title="All-time Profit"
            value={`Rs ${stats.AllTimeProfit}`}
            icon={<Banknote className="w-5 h-5" />}
            color="bg-purple-500/20 text-purple-600 dark:text-purple-400"
          />
          <Card
            title="Products"
            value={stats.Products}
            icon={<Package className="w-5 h-5" />}
            color="bg-gray-500/20 text-gray-600 dark:text-gray-400"
          />
          <Card
            title="Variants"
            value={stats.Variants}
            icon={<Boxes className="w-5 h-5" />}
            color="bg-gray-500/20 text-gray-600 dark:text-gray-400"
          />
          <Card
            title="Low-stock Items"
            value={stats.LowStock}
            icon={<TrendingDown className="w-5 h-5" />}
            color="bg-red-500/20 text-red-600 dark:text-red-400"
          />
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}
