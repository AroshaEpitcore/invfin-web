"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getLookups,
  getProductsByCategory,
  getSizes,
  getVariantsByProductAndSize,
  sellStock,
  recordBackfill, // updated action
} from "./actions";
import { Zap, Package } from "lucide-react";

export default function SalesPage() {
  const [lookups, setLookups] = useState<any>({ categories: [] });
  const [products, setProducts] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  const [selectedCat, setSelectedCat] = useState("");
  const [selectedProd, setSelectedProd] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  // Backfill form
  const [backfill, setBackfill] = useState({
    date: "",
    qty: "",
    cost: "",
    price: "",
  });

  useEffect(() => {
    loadLookups();
  }, []);

  async function loadLookups() {
    const res = await getLookups();
    setLookups(res);
  }

  async function handleCategoryChange(catId: string) {
    setSelectedCat(catId);
    setSelectedProd("");
    setSelectedSize("");
    setVariants([]);
    if (!catId) return;
    const prods = await getProductsByCategory(catId);
    setProducts(prods);
  }

  async function handleProductChange(prodId: string) {
    setSelectedProd(prodId);
    setSelectedSize("");
    setVariants([]);
    if (!prodId) return;
    const s = await getSizes(prodId);
    setSizes(s);
  }

  async function handleSizeChange(sizeId: string) {
    setSelectedSize(sizeId);
    if (!selectedProd || !sizeId) {
      setVariants([]);
      return;
    }
    const vars = await getVariantsByProductAndSize(selectedProd, sizeId);
    setVariants(
      vars.map((v) => ({
        ...v,
        _sellQty: 1,
        _sellPrice: v.SellingPrice ?? "",
      }))
    );
  }

  async function handleSell(v: any, qty: number) {
    try {
      await sellStock(v.Id, qty, v._sellPrice || v.SellingPrice);
      toast.success(`Sold ${qty} unit(s) at ${v._sellPrice || v.SellingPrice}`);
      if (selectedProd && selectedSize) handleSizeChange(selectedSize);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleBackfill() {
    try {
      if (!selectedProd) return toast.error("Pick a product first");

      await recordBackfill(
        selectedProd,
        backfill.date,
        Number(backfill.qty || 0),
        Number(backfill.cost || 0),
        Number(backfill.price || 0)
      );

      toast.success("Backfill recorded!");
      setBackfill({ date: "", qty: "", cost: "", price: "" });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-3 rounded-lg">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Sales</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedCat}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
        >
          <option value="">-- Select Category --</option>
          {lookups.categories?.map((c: any) => (
            <option key={c.Id} value={c.Id}>
              {c.Name}
            </option>
          ))}
        </select>

        <select
          value={selectedProd}
          onChange={(e) => handleProductChange(e.target.value)}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          disabled={!selectedCat}
        >
          <option value="">-- Select Product --</option>
          {products.map((p: any) => (
            <option key={p.Id} value={p.Id}>
              {p.Name}
            </option>
          ))}
        </select>

        <select
          value={selectedSize}
          onChange={(e) => handleSizeChange(e.target.value)}
          className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          disabled={!selectedProd}
        >
          <option value="">-- Select Size --</option>
          {sizes.map((s: any) => (
            <option key={s.Id} value={s.Id}>
              {s.Name}
            </option>
          ))}
        </select>
      </div>

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="overflow-x-auto mb-8">
          <table className="w-full border border-gray-200 dark:border-gray-700 text-sm">
            <thead className="bg-gray-100 dark:bg-gray-700/50">
              <tr>
                <th className="p-3 text-left">Size</th>
                <th className="p-3 text-left">Color</th>
                <th className="p-3 text-center">In Stock</th>
                <th className="p-3 text-center">Sell Price</th>
                <th className="p-3 text-center">Qty</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr
                  key={v.Id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="p-3">{v.Size}</td>
                  <td className="p-3">{v.Color}</td>
                  <td className="p-3 text-center">{v.Qty}</td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      step="0.01"
                      value={v._sellPrice ?? ""}
                      placeholder="Sell price"
                      onChange={(e) => {
                        const price =
                          e.target.value === "" ? "" : parseFloat(e.target.value);
                        const updated = [...variants];
                        updated[i]._sellPrice = price;
                        setVariants(updated);
                      }}
                      className="w-24 border rounded px-2 py-1 text-center bg-gray-50 dark:bg-gray-800"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={v._sellQty ?? 1}
                      placeholder="Qty"
                      onChange={(e) => {
                        const qty = parseInt(e.target.value) || 1;
                        const updated = [...variants];
                        updated[i]._sellQty = qty;
                        setVariants(updated);
                      }}
                      className="w-20 border rounded px-2 py-1 text-center bg-gray-50 dark:bg-gray-800"
                    />
                  </td>
                  <td className="p-3 flex gap-2 justify-center">
                    <button
                      onClick={() => handleSell(v, 1)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded flex items-center gap-1"
                    >
                      <Zap className="w-4 h-4" /> +1
                    </button>
                    <button
                      onClick={() => handleSell(v, v._sellQty)}
                      className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded"
                    >
                      Sell
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Backfill Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Backfill Pre-System Sales</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input
              type="date"
              value={backfill.date}
              onChange={(e) => setBackfill({ ...backfill, date: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Qty (Sold)</label>
            <input
              type="number"
              placeholder="e.g. 50"
              value={backfill.qty}
              onChange={(e) => setBackfill({ ...backfill, qty: e.target.value })}
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit Cost</label>
            <input
              type="number"
              placeholder="e.g. 250"
              value={backfill.cost}
              onChange={(e) =>
                setBackfill({ ...backfill, cost: e.target.value })
              }
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Unit Selling</label>
            <input
              type="number"
              placeholder="e.g. 350"
              value={backfill.price}
              onChange={(e) =>
                setBackfill({ ...backfill, price: e.target.value })
              }
              className="w-full border rounded px-3 py-2 bg-gray-50 dark:bg-gray-700"
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleBackfill}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg"
          >
            Record Backfill
          </button>
        </div>
      </div>
    </div>
  );
}
