"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getCustomers, getCustomerById, getCustomerOrders, deleteCustomer, updateCustomer } from "./actions";
import { User, Phone, MapPin, Trash2, Edit, ShoppingBag, X } from "lucide-react";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  async function load() {
    const data = await getCustomers();
    setCustomers(data);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.Name.toLowerCase().includes(search.toLowerCase()) ||
      (c.Phone && c.Phone.includes(search))
  );

  async function openDrawer(id: string) {
    const data = await getCustomerById(id);
    const orderList = await getCustomerOrders(id);
    setSelected(data);
    setOrders(orderList);
    setDrawerOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    await deleteCustomer(id);
    toast.success("Customer deleted");
    load();
  }

  async function handleSave() {
    if (!selected) return;
    setUpdating(true);
    await updateCustomer(selected.Id, selected.Phone, selected.Address);
    toast.success("Customer updated");
    setUpdating(false);
    load();
  }

  return (
    <div className="text-gray-900 dark:text-white relative">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Customers
        </h1>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700/40">
            <tr>
              <th className="text-left p-3 font-semibold">Name</th>
              <th className="text-left p-3 font-semibold">Phone</th>
              <th className="text-left p-3 font-semibold">Address</th>
              <th className="text-center p-3 font-semibold">Orders</th>
              <th className="text-center p-3 font-semibold">Total Spent</th>
              <th className="text-center p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-6 text-gray-500">
                  No customers found
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.Id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/40 cursor-pointer"
                  onClick={() => openDrawer(c.Id)}
                >
                  <td className="p-3">{c.Name}</td>
                  <td className="p-3">{c.Phone || "-"}</td>
                  <td className="p-3">{c.Address || "-"}</td>
                  <td className="p-3 text-center">{c.OrderCount}</td>
                  <td className="p-3 text-center font-semibold">Rs {c.TotalSpent?.toFixed(2)}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(c.Id);
                      }}
                      className="text-red-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drawer */}
      {drawerOpen && selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 h-full p-6 flex flex-col shadow-xl overflow-y-auto transition-all duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {selected.Name}
              </h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm mb-1 text-gray-600 dark:text-gray-400">
                  Phone
                </label>
                <input
                  value={selected.Phone || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, Phone: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-600 dark:text-gray-400">
                  Address
                </label>
                <textarea
                  value={selected.Address || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, Address: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
              <button
                disabled={updating}
                onClick={handleSave}
                className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                <Edit className="w-4 h-4" />
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Joined: {new Date(selected.CreatedAt).toLocaleDateString()}
              </p>
              <div className="flex justify-between text-sm font-medium mb-4">
                <span>Total Orders:</span>
                <span>{selected.OrderCount}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mb-4">
                <span>Total Spent:</span>
                <span>Rs {selected.TotalSpent?.toFixed(2)}</span>
              </div>

              {/* Recent Orders */}
              <h3 className="text-lg font-semibold flex items-center gap-2 mt-6 mb-3">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Recent Orders
              </h3>
              {orders.length === 0 ? (
                <p className="text-sm text-gray-500">No orders found</p>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-800/50">
                      <tr>
                        <th className="p-2 text-left font-medium">Date</th>
                        <th className="p-2 text-center font-medium">Status</th>
                        <th className="p-2 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr
                          key={o.Id}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <td className="p-2">
                            {new Date(o.OrderDate).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-center">{o.PaymentStatus}</td>
                          <td className="p-2 text-right">
                            Rs {o.Total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
