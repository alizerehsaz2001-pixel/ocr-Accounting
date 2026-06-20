import React from "react";
import { Sun, Moon } from "lucide-react";

interface ThemeSwitcherProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export default function ThemeSwitcher({ isDarkMode, toggleDarkMode }: ThemeSwitcherProps) {
  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-xl transition-all duration-300 ${
        isDarkMode
          ? "bg-slate-800 text-amber-400 hover:bg-slate-700"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
      aria-label="Toggle theme"
    >
      {isDarkMode ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
