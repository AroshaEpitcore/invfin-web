"use client";

import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getCategories,
  getProductsByCategory,
  getSizesByProduct,
  getColorsByProductAndSize,
  getVariant,
  getRecentOrders,
  createOrder,
  type OrderItemInput,
  type OrderPayload,
} from "./actions";
import { Package, Plus, Trash2, Clipboard, CheckCircle2 } from "lucide-react";

type Opt = { Id: string; Name: string };

type LineDraft = {
  key: string;            // local key
  productId?: string;
  sizeId?: string;
  colorId?: string;
  variant?: { VariantId: string; InStock: number; SellingPrice: number };
  qty: number;
  price: number;          // editable sell price
};

export default function OrdersPage() {
  // lookups
  const [categories, setCategories] = useState<Opt[]>([]);
  const [products, setProducts]   = useState<Opt[]>([]);
  const [sizes, setSizes]         = useState<Opt[]>([]);
  const [colors, setColors]       = useState<Opt[]>([]);

  // filters (picker controlling the add-line row)
  const [selCat, setSelCat]     = useState("");
  const [selProd, setSelProd]   = useState("");
  const [selSize, setSelSize]   = useState("");
  const [selColor, setSelColor] = useState("");

  // add-line qty/price
  const [lineQty, setLineQty]     = useState<number>(1);
  const [linePrice, setLinePrice] = useState<number>(0);

  // order details
  const [customer, setCustomer]       = useState("");
  const [phone, setPhone]             = useState("");
  const [address, setAddress]         = useState("");
  const [status, setStatus]           = useState<"Pending" | "Paid" | "Partial" | "Canceled">("Pending");
  const [orderDate, setOrderDate]     = useState<string>(() => new Date().toISOString().slice(0,10));
  const [discount, setDiscount]       = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [note, setNote]               = useState("");

  // cart lines
  const [lines, setLines] = useState<LineDraft[]>([]);

  // recent orders
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const cats = await getCategories();
      setCategories(cats);
      loadRecent();
    })();
  }, []);

  async function loadRecent() {
    const r = await getRecentOrders(12);
    setRecent(r);
  }

  /* ---- cascading pickers to build a line ---- */
  async function onPickCategory(catId: string) {
    setSelCat(catId);
    setSelProd(""); setProducts([]);
    setSelSize(""); setSizes([]);
    setSelColor(""); setColors([]);
    setLineQty(1); setLinePrice(0);

    if (!catId) return;
    const prods = await getProductsByCategory(catId);
    setProducts(prods);
  }

  async function onPickProduct(prodId: string) {
    setSelProd(prodId);
    setSelSize(""); setSizes([]);
    setSelColor(""); setColors([]);
    setLineQty(1); setLinePrice(0);
    if (!prodId) return;
    const s = await getSizesByProduct(prodId);
    setSizes(s);
  }

  async function onPickSize(sizeId: string) {
    setSelSize(sizeId);
    setSelColor(""); setColors([]);
    setLineQty(1); setLinePrice(0);
    if (!selProd || !sizeId) return;
    const c = await getColorsByProductAndSize(selProd, sizeId);
    setColors(c);
  }

  async function onPickColor(colorId: string) {
    setSelColor(colorId);
    setLineQty(1);
    if (selProd && selSize && colorId) {
      const v = await getVariant(selProd, selSize, colorId);
      if (!v) {
        toast.error("Variant not found.");
        return;
      }
      setLinePrice(Number(v.SellingPrice) || 0);
    }
  }

  async function addLine() {
    if (!selProd || !selSize || !selColor) {
      toast.error("Pick Product, Size, Color first.");
      return;
    }
    const v = await getVariant(selProd, selSize, selColor);
    if (!v) { toast.error("Variant not found."); return; }
    if (lineQty <= 0) { toast.error("Qty must be > 0"); return; }
    if (lineQty > v.InStock) {
      toast.error(`Only ${v.InStock} in stock for this variant.`);
      return;
    }
    const key = `${v.VariantId}-${Date.now()}`;
    setLines(prev => [
      ...prev,
      {
        key,
        productId: selProd,
        sizeId: selSize,
        colorId: selColor,
        variant: v,
        qty: lineQty,
        price: Number(linePrice || v.SellingPrice || 0),
      }
    ]);
    setLineQty(1);
  }

  function removeLine(key: string) {
    setLines(prev => prev.filter(l => l.key !== key));
  }

  function updateLineQty(key: string, qty: number) {
    setLines(prev => prev.map(l => l.key === key ? { ...l, qty } : l));
  }

  function updateLinePrice(key: string, price: number) {
    setLines(prev => prev.map(l => l.key === key ? { ...l, price } : l));
  }

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.qty * l.price, 0),
    [lines]
  );
  const total = useMemo(() => Math.max(0, subtotal - (discount || 0) + (deliveryFee || 0)), [subtotal, discount, deliveryFee]);

  async function saveOrder() {
    if (!lines.length) { toast.error("No items in order"); return; }
    for (const l of lines) {
      if (!l.variant) { toast.error("Variant missing."); return; }
      if (l.qty <= 0) { toast.error("Qty must be > 0"); return; }
      if (l.qty > l.variant.InStock) {
        toast.error("One line exceeds available stock.");
        return;
      }
    }

    const payload: OrderPayload = {
      Customer: customer || null,
      Phone: phone || null,
      Address: address || null,
      PaymentStatus: status,
      OrderDate: orderDate,
      Subtotal: Number(subtotal.toFixed(2)),
      Discount: Number((discount || 0).toFixed(2)),
      DeliveryFee: Number((deliveryFee || 0).toFixed(2)),
      Total: Number(total.toFixed(2)),
      Note: note || null,
      Items: lines.map<OrderItemInput>(l => ({
        VariantId: l.variant!.VariantId,
        Qty: l.qty,
        SellingPrice: Number(l.price || 0),
      })),
    };

    try {
      await createOrder(payload);
      toast.success("Order saved");
      setLines([]);
      setDiscount(0);
      setDeliveryFee(0);
      setNote("");
      loadRecent();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save order");
    }
  }

  function copySummary() {
    const s = [
      `Customer: ${customer}`,
      `Date: ${orderDate}`,
      `Status: ${status}`,
      `Subtotal: ${subtotal.toFixed(2)}`,
      `Discount: ${Number(discount || 0).toFixed(2)}`,
      `Delivery: ${Number(deliveryFee || 0).toFixed(2)}`,
      `Total: ${total.toFixed(2)}`,
      `Items:`,
      ...lines.map(l => ` - ${l.variant?.VariantId}  x${l.qty}  @${l.price.toFixed(2)}`),
      note ? `Note: ${note}` : "",
    ].join("\n");
    navigator.clipboard.writeText(s).then(() => toast.success("Copied"), () => toast.error("Copy failed"));
  }

  return (
    <div className="text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary/20 p-3 rounded-lg">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Orders</h1>
      </div>

      {/* Customer + Order meta */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <label className="flex flex-col">
          <span className="text-sm mb-1">Customer Name</span>
          <input
            placeholder="Customer name"
            value={customer}
            onChange={(e)=>setCustomer(e.target.value)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">Phone</span>
          <input
            placeholder="Phone"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">Address</span>
          <input
            placeholder="Address"
            value={address}
            onChange={(e)=>setAddress(e.target.value)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">Status</span>
          <select
            value={status}
            onChange={(e)=>setStatus(e.target.value as any)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          >
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Canceled">Canceled</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">Order Date</span>
          <input
            type="date"
            value={orderDate}
            onChange={(e)=>setOrderDate(e.target.value)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-sm mb-1">Note</span>
          <input
            placeholder="Note (optional)"
            value={note}
            onChange={(e)=>setNote(e.target.value)}
            className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
          />
        </label>
      </section>

      {/* Add line */}
      <section className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Add Line</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <label className="flex flex-col">
            <span className="text-sm mb-1">Category</span>
            <select value={selCat} onChange={(e)=>onPickCategory(e.target.value)} className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800">
              <option value="">Category</option>
              {categories.map(c=> <option key={c.Id} value={c.Id}>{c.Name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Product</span>
            <select value={selProd} onChange={(e)=>onPickProduct(e.target.value)} disabled={!selCat} className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800">
              <option value="">Product</option>
              {products.map(p=> <option key={p.Id} value={p.Id}>{p.Name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Size</span>
            <select value={selSize} onChange={(e)=>onPickSize(e.target.value)} disabled={!selProd} className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800">
              <option value="">Size</option>
              {sizes.map(s=> <option key={s.Id} value={s.Id}>{s.Name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Color</span>
            <select value={selColor} onChange={(e)=>onPickColor(e.target.value)} disabled={!selSize} className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800">
              <option value="">Color</option>
              {colors.map(c=> <option key={c.Id} value={c.Id}>{c.Name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Quantity</span>
            <input
              type="number" min={1}
              value={lineQty}
              onChange={(e)=>setLineQty(Math.max(1, parseInt(e.target.value || "1")))}
              className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
              placeholder="Qty"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm mb-1">Sell Price</span>
            <input
              type="number" step="0.01"
              value={linePrice}
              onChange={(e)=>setLinePrice(parseFloat(e.target.value || "0"))}
              className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-800"
              placeholder="Sell price"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button onClick={addLine} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </section>

      {/* Cart lines */}
      <section className="bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Items</h2>
        {lines.length === 0 ? (
          <p className="text-sm text-gray-500">No items yet. Add from above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/40">
                <tr>
                  <th className="p-3 text-left">Variant</th>
                  <th className="p-3 text-center">In Stock</th>
                  <th className="p-3 text-center">Sell Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-center">Line Total</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.key} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="p-3">
                      <div className="text-xs text-gray-500">VariantId</div>
                      <div className="font-mono">{l.variant?.VariantId}</div>
                    </td>
                    <td className="p-3 text-center">{l.variant?.InStock ?? 0}</td>
                    <td className="p-3 text-center">
                      <label className="flex flex-col">
                        <input
                          type="number" step="0.01"
                          value={l.price}
                          onChange={(e)=>updateLinePrice(l.key, parseFloat(e.target.value || "0"))}
                          className="w-24 text-center border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800"
                        />
                      </label>
                    </td>
                    <td className="p-3 text-center">
                      <label className="flex flex-col">
                        <input
                          type="number" min={1}
                          value={l.qty}
                          onChange={(e)=>updateLineQty(l.key, Math.max(1, parseInt(e.target.value || "1")))}
                          className="w-20 text-center border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800"
                        />
                      </label>
                    </td>
                    <td className="p-3 text-center">
                      {(l.qty * l.price).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={()=>removeLine(l.key)}
                        className="text-red-600 hover:text-red-700 px-2 py-1 rounded inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className="p-3">
                    <div className="flex flex-col md:flex-row gap-3 items-end justify-end">
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <label className="text-sm text-gray-600 dark:text-gray-300">Subtotal</label>
                        <div className="text-right font-semibold">{subtotal.toFixed(2)}</div>
                        <label className="text-sm text-gray-600 dark:text-gray-300">Discount</label>
                        <input
                          type="number" step="0.01"
                          value={discount}
                          onChange={(e)=>setDiscount(parseFloat(e.target.value || "0"))}
                          className="w-32 text-right border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800"
                        />
                        <label className="text-sm text-gray-600 dark:text-gray-300">Delivery</label>
                        <input
                          type="number" step="0.01"
                          value={deliveryFee}
                          onChange={(e)=>setDeliveryFee(parseFloat(e.target.value || "0"))}
                          className="w-32 text-right border rounded px-2 py-1 bg-gray-50 dark:bg-gray-800"
                        />
                        <label className="text-sm text-gray-900 dark:text-white">Total</label>
                        <div className="text-right text-lg font-bold">{total.toFixed(2)}</div>
                      </div>

                      <div className="flex gap-2">
                        <button onClick={copySummary} className="border px-4 py-2 rounded flex items-center gap-2">
                          <Clipboard className="w-4 h-4" /> Copy
                        </button>
                        <button onClick={saveOrder} className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" /> Save Order
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Recent orders */}
      <section>
        <h2 className="font-semibold mb-3">Recent Orders</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">No orders yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recent.map(o => (
              <div key={o.Id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold">{o.Customer || "Walk-in"}</div>
                  <span className="text-xs px-2 py-1 rounded-full border">
                    {o.PaymentStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {new Date(o.OrderDate).toLocaleString()}
                </div>
                <div className="text-sm flex justify-between">
                  <span>Lines</span>
                  <span className="font-medium">{o.LineCount}</span>
                </div>
                <div className="text-sm flex justify-between">
                  <span>Total</span>
                  <span className="font-bold">{o.Total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
