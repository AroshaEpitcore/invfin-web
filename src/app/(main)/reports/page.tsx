"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getCategories,
  getProducts,
  getSizes,
  getColors,
  runInventoryReport,
  runSalesReport,
  runExpensesReport,
  runPnLReport,
  runDeadStockReport,
} from "./actions";
import { BarChart2, Filter, Package, DollarSign, Trash2 } from "lucide-react";

type Option = { Id: string; Name: string };

type Filters = {
  category: string;
  product: string;
  size: string;
  color: string;
  from: string;
  to: string;
};

type InventoryRow = {
  Category: string;
  Product: string;
  Size: string;
  Color: string;
  Qty: number;
};

export default function ReportPage() {
  const [categories, setCategories] = useState<Option[]>([]);
  const [products, setProducts] = useState<Option[]>([]);
  const [sizes, setSizes] = useState<Option[]>([]);
  const [colors, setColors] = useState<Option[]>([]);

  const [filters, setFilters] = useState<Filters>({
    category: "",
    product: "",
    size: "",
    color: "",
    from: "",
    to: "",
  });

  const [activeTab, setActiveTab] = useState<
    "inventory" | "sales" | "expenses" | "pnl" | "deadStock"
  >("inventory");

  const [inventoryData, setInventoryData] = useState<InventoryRow[] | null>(
    null
  );
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [pnlData, setPnlData] = useState<any | null>(null);
  const [deadStockData, setDeadStockData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const tabs: Array<"inventory" | "sales" | "expenses" | "pnl" | "deadStock"> =
    ["inventory", "sales", "expenses", "pnl", "deadStock"];

  // Load dropdowns initially
  useEffect(() => {
    (async () => {
      try {
        const [c, s, col, pAll] = await Promise.all([
          getCategories(),
          getSizes(),
          getColors(),
          getProducts(),
        ]);
        setCategories(c);
        setSizes(s);
        setColors(col);
        setProducts(pAll);
      } catch (e: any) {
        toast.error(e.message || "Failed to load filters");
      }
    })();
  }, []);

  // When category changes, refetch products
  useEffect(() => {
    (async () => {
      try {
        setFilters((f) => ({ ...f, product: "" }));
        const prods = await getProducts(filters.category || undefined);
        setProducts(prods);
      } catch (e: any) {
        toast.error(e.message || "Failed to load products");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category]);

  async function runReport() {
    setLoading(true);
    try {
      if (activeTab === "inventory") {
        setInventoryData(await runInventoryReport(filters));
      }
      if (activeTab === "sales") {
        setSalesData(await runSalesReport(filters));
      }
      if (activeTab === "expenses") {
        setExpensesData(await runExpensesReport(filters));
      }
      if (activeTab === "pnl") {
        setPnlData(await runPnLReport(filters.from, filters.to));
      }
      if (activeTab === "deadStock") {
        setDeadStockData(await runDeadStockReport(filters));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to run report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-lg">
          <BarChart2 className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">Reports</h1>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-2 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((f) => ({ ...f, category: e.target.value }))
          }
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.Id} value={c.Id}>
              {c.Name}
            </option>
          ))}
        </select>

        {/* Product */}
        <select
          value={filters.product}
          onChange={(e) =>
            setFilters((f) => ({ ...f, product: e.target.value }))
          }
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.Id} value={p.Id}>
              {p.Name}
            </option>
          ))}
        </select>

        {/* Size */}
        <select
          value={filters.size}
          onChange={(e) => setFilters((f) => ({ ...f, size: e.target.value }))}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        >
          <option value="">All Sizes</option>
          {sizes.map((s) => (
            <option key={s.Id} value={s.Id}>
              {s.Name}
            </option>
          ))}
        </select>

        {/* Color */}
        <select
          value={filters.color}
          onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        >
          <option value="">All Colors</option>
          {colors.map((c) => (
            <option key={c.Id} value={c.Id}>
              {c.Name}
            </option>
          ))}
        </select>

        {/* From */}
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        />

        {/* To */}
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        />
      </div>

      {/* Run Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={runReport}
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg px-6 py-2 flex items-center gap-2 disabled:opacity-60"
        >
          <Filter className="w-4 h-4" />
          {loading ? "Running..." : `Run ${activeTab} Report`}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-2 font-medium capitalize ${
              activeTab === tab
                ? "border-b-2 border-primary text-primary"
                : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
            }`}
          >
            {tab === "pnl" ? "P & L" : tab}
          </button>
        ))}
      </div>

      {/* Report Data */}
      <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        {/* Inventory */}
        {activeTab === "inventory" && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Inventory Report
            </h2>
            {!inventoryData ? (
              <p className="text-gray-500 text-center py-12">
                Run a report to see inventory data
              </p>
            ) : inventoryData.length === 0 ? (
              <p className="text-gray-500">No inventory data</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Size</th>
                    <th className="p-3 text-left">Color</th>
                    <th className="p-3 text-left">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryData.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{row.Category}</td>
                      <td className="p-3">{row.Product}</td>
                      <td className="p-3">{row.Size}</td>
                      <td className="p-3">{row.Color}</td>
                      <td className="p-3">{row.Qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Sales */}
        {activeTab === "sales" && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Sales Report
            </h2>
            {!salesData ? (
              <p className="text-gray-500 text-center py-12">
                Run a report to see sales data
              </p>
            ) : salesData.length === 0 ? (
              <p className="text-gray-500">No sales data</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Qty Sold</th>
                    <th className="p-3 text-left">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{row.Product}</td>
                      <td className="p-3">{row.Qty}</td>
                      <td className="p-3">Rs {row.Revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* Expenses */}
        {activeTab === "expenses" && (
          <>
            <h2 className="text-lg font-semibold mb-4">Expenses Report</h2>
            {!expensesData ? (
              <p className="text-gray-500 text-center py-12">
                Run a report to see expenses data
              </p>
            ) : expensesData.length === 0 ? (
              <p className="text-gray-500">No expenses data</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesData.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{row.Description}</td>
                      <td className="p-3">Rs {row.Amount}</td>
                      <td className="p-3">
                        {new Date(row.UsageDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* P&L */}
        {activeTab === "pnl" && (
          <>
            <h2 className="text-lg font-semibold mb-4">Profit & Loss</h2>
            {!pnlData ? (
              <p className="text-gray-500 text-center py-12">
                Run a report to see P&L
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <p className="text-sm">Revenue</p>
                  <p className="text-lg font-bold">Rs {pnlData.Revenue}</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <p className="text-sm">Cost of Goods Sold</p>
                  <p className="text-lg font-bold">Rs {pnlData.COGS}</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-sm">Gross Profit</p>
                  <p className="text-lg font-bold">Rs {pnlData.GrossProfit}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Dead Stock */}
        {activeTab === "deadStock" && (
          <>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-primary" /> Dead Stock
            </h2>
            {!deadStockData ? (
              <p className="text-gray-500 text-center py-12">
                Run a report to see dead stock
              </p>
            ) : deadStockData.length === 0 ? (
              <p className="text-gray-500">No dead stock items</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700/50">
                  <tr>
                    <th className="p-3 text-left">Product</th>
                    <th className="p-3 text-left">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {deadStockData.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{row.Product}</td>
                      <td className="p-3">{row.Qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
