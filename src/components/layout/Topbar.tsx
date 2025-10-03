"use client";

import { Moon, Sun, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  Id: string;
  Username: string;
  Email: string;
  Role: string;
};

export default function Topbar({
  onToggleSidebar,
}: {
  onToggleSidebar: () => void;
}) {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("authUser");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  function handleLogout() {
    localStorage.removeItem("authUser");
    router.push("/"); // go back to login
  }

  return (
    <header className="h-14 flex items-center justify-between bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b px-4">
      {/* Left side: collapse btn + brand */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Dashboard
        </h1>
      </div>

      {/* Middle zone: Moving Announcement */}
      <div className="flex-1 mx-4 overflow-hidden">
        <div className="whitespace-nowrap animate-marquee text-sm text-gray-700 dark:text-gray-300">
          ⚡ Welcome to EssenceFit! Manage all your inventory and finances with ease.   Check out the latest updates and reports.
        </div>
      </div>

      {/* Right side: user info + dark mode + logout */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {user.Username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user.Role}
            </p>
          </div>
        )}

        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          onClick={handleLogout}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Tailwind animation for marquee */}
      <style jsx>{`
        .animate-marquee {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </header>
  );
}
