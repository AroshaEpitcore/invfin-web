"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getUsers, addUser, updateUser, deleteUser } from "./actions";
import { Plus, Edit, Trash2, Users } from "lucide-react";

type User = {
  Id: string;
  Username: string;
  Email: string;
  Role: string;
  CreatedAt: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<User> & { Password?: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSave() {
    try {
      if (!form.Username || !form.Email || (!editingId && !form.Password)) {
        toast.error("Please fill all fields");
        return;
      }

      if (editingId) {
        await updateUser(editingId, form.Username!, form.Email!, form.Role || "Staff");
        toast.success("User updated");
      } else {
        await addUser(form.Username!, form.Email!, form.Password!, form.Role || "Staff");
        toast.success("User added");
      }

      setForm({});
      setEditingId(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteUser(id);
      toast.success("User deleted");
      refresh();
    } catch {
      toast.error("Delete failed");
    }
  }

  return (
    <div className="text-gray-900 dark:text-white">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-3 rounded-lg">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold">Users</h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800/50 border rounded-xl p-5 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            placeholder="Username"
            value={form.Username || ""}
            onChange={(e) => setForm({ ...form, Username: e.target.value })}
            className="input"
          />
          <input
            placeholder="Email"
            value={form.Email || ""}
            onChange={(e) => setForm({ ...form, Email: e.target.value })}
            className="input"
          />
          {!editingId && (
            <input
              type="password"
              placeholder="Password"
              value={form.Password || ""}
              onChange={(e) => setForm({ ...form, Password: e.target.value })}
              className="input"
            />
          )}
          <select
            value={form.Role || "Staff"}
            onChange={(e) => setForm({ ...form, Role: e.target.value })}
            className="input"
          >
            <option value="Admin">Admin</option>
            <option value="Staff">Staff</option>
          </select>
          <button
            onClick={handleSave}
            className="bg-primary text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {editingId ? "Update" : "Add"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800/50 border rounded-xl p-5">
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700/50">
                <tr>
                  <th className="p-3 text-left">Username</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Created At</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.Id} className="border-t">
                    <td className="p-3">{u.Username}</td>
                    <td className="p-3">{u.Email}</td>
                    <td className="p-3">{u.Role}</td>
                    <td className="p-3">
                      {new Date(u.CreatedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(u.Id);
                          setForm({ ...u });
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.Id)}
                        className="px-3 py-1 bg-red-500 text-white rounded flex items-center gap-1"
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

/* Small utility */
const input =
  "w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary";
