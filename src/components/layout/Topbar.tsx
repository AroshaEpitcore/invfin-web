"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Topbar() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <header className="h-14 flex items-center justify-between bg-white/70 dark:bg-gray-900/70 backdrop-blur border-b px-4">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        Dashboard
      </h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
    </header>
  );
}
