import { Search, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function KevarHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 bg-[hsl(var(--kevar-header))] flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative hidden sm:block flex-1 max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" size={18} />
          <input
            type="text"
            placeholder="Buscar funcionário ou processo..."
            className="bg-white/10 border-none rounded-full py-2 pl-10 pr-4 w-full text-sm text-white placeholder:text-white/50 focus:ring-1 focus:ring-accent outline-none transition-all font-inter"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Competência pill */}
        <div className="bg-accent/20 border border-accent/30 px-3 md:px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent hidden md:inline">
            Competência
          </span>
          <span className="font-nirmala text-sm text-white">Mar/2025</span>
        </div>

        {/* Notifications */}
        <div className="relative cursor-pointer">
          <Bell size={22} className="text-white/70 hover:text-white transition-colors" />
          <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            4
          </span>
        </div>

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-xs font-medium text-white font-inter">Ana Gestora</p>
            <p className="text-[10px] text-white/60 font-inter">RH Senior</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-accent to-yellow-200 border-2 border-white/20" />
        </div>
      </div>
    </header>
  );
}
