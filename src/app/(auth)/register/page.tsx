"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("Staff");
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const res = await fetch("/register-action", {
        method: "POST",
        body: JSON.stringify({ username, email, password, role }),
      });

      if (!res.ok) {
        throw new Error("Registration failed");
      }

      toast.success("Account created successfully!");
      localStorage.setItem("authUser", JSON.stringify({ username, email, role }));
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Create an Account
        </h1>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-700"
            >
              <option value="Admin">Admin</option>
              <option value="Staff">Staff</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2 text-white font-semibold shadow hover:bg-primary/90"
          >
            Register
          </button>
        </form>

        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
