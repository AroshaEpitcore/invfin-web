"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense,
} from "./actions";
import { PlusCircle, Edit, Trash2, Save } from "lucide-react";

type Expense = {
  Id: string;
  Category: string;
  Description: string;
  Amount: number;
  ExpenseDate: string;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState({
    id: "",
    category: "",
    description: "",
    amount: "",
    date: "",
  });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (e: any) {
      toast.error("Failed to load expenses");
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault();
    if (!form.category || !form.amount) {
      toast.error("Category and amount are required");
      return;
    }
    try {
      if (editing) {
        await updateExpense(form.id, form);
        toast.success("Expense updated");
      } else {
        await addExpense(form);
        toast.success("Expense added");
      }
      setForm({ id: "", category: "", description: "", amount: "", date: "" });
      setEditing(false);
      loadExpenses();
    } catch (e: any) {
      toast.error("Failed to save expense");
    }
  }

  async function handleEdit(exp: Expense) {
    setForm({
      id: exp.Id,
      category: exp.Category,
      description: exp.Description || "",
      amount: exp.Amount.toString(),
      date: exp.ExpenseDate.substring(0, 10),
    });
    setEditing(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
      loadExpenses();
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  return (
    <div className="text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-lg">
          <PlusCircle className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Expenses</h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4"
      >
        <input
          type="text"
          placeholder="Category"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <input
          type="number"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
        />
        <button
          type="submit"
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {editing ? "Update" : "Add"}
        </button>
      </form>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800/50 border rounded-xl p-5">
        {expenses.length === 0 ? (
          <p className="text-gray-500">No expenses found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="p-2 text-left">Category</th>
                  <th className="p-2 text-left">Description</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((exp) => (
                  <tr key={exp.Id} className="border-t">
                    <td className="p-2">{exp.Category}</td>
                    <td className="p-2">{exp.Description}</td>
                    <td className="p-2">Rs {exp.Amount.toFixed(2)}</td>
                    <td className="p-2">
                      {new Date(exp.ExpenseDate).toLocaleDateString()}
                    </td>
                    <td className="p-2 flex gap-2">
                      <button
                        onClick={() => handleEdit(exp)}
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(exp.Id)}
                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
