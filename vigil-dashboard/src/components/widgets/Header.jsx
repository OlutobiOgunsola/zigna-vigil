import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export default function Header() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-end h-16">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-full border border-border-gray bg-white text-text-secondary hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium text-gray-500">Super Admin</span>
          <span className="text-[11px] text-gray-400">Zigna Vigil</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-vigil/20 flex items-center justify-center">
          <span className="text-sm font-bold text-vigil">V</span>
        </div>
      </div>
    </header>
  );
}
