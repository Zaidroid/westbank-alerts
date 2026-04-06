import { useState, useEffect } from "react";
import { Search, Radio, Sun, Moon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConnectionIndicator } from "./ConnectionIndicator";
import type { ConnectionStatus } from "@/lib/api/types";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Header({ connectionStatus, searchQuery, onSearchChange }: HeaderProps) {
  const [time, setTime] = useState<string>("");
  const [searchOpen, setSearchOpen] = useState(false);
  const { lang, setLang, t } = useLang();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
      <div className="flex h-13 items-center px-4 md:px-6 gap-2 lg:gap-4 justify-between md:justify-start">
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center h-7 w-7 md:h-8 md:w-8 rounded-md bg-primary/10 text-primary">
            <Radio className="h-4 w-4 md:h-5 md:w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-sm leading-none line-clamp-1">
              {t.appTitle}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-destructive"></span>
              </span>
              <span className="text-[9px] font-bold text-destructive uppercase tracking-widest">{t.live}</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-center max-w-md mx-4 lg:mx-6">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              className="w-full bg-muted/50 border-border h-9 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setSearchOpen(v => !v)}
            aria-label="Toggle search"
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="font-bold text-xs h-8 px-2"
          >
            {lang === "ar" ? "EN" : "عربي"}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <ConnectionIndicator status={connectionStatus} />

          <div className="hidden lg:block font-mono text-sm font-medium tracking-tight text-muted-foreground border-s border-border ps-3" dir="ltr">
            {time}
          </div>
        </div>
      </div>

      {searchOpen && (
        <div className="md:hidden border-t border-border px-4 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t.searchPlaceholder}
              className="w-full bg-muted/50 border-border h-9 pl-9 text-sm focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              autoFocus
              data-testid="input-search-mobile"
            />
          </div>
        </div>
      )}
    </header>
  );
}
