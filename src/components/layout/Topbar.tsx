import { useEffect, useState } from "react";
import { Bell, ChevronDown, User, Sun, Moon, Wifi, Briefcase, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EntitySelector } from "./EntitySelector";
import { GlobalSearch } from "./GlobalSearch";
import { notifications } from "@/mock/financialData";
import { cn } from "@/lib/utils";

const periodOptions = [
  { value: "month", label: "Março 2025" },
  { value: "quarter", label: "Q1 2025" },
  { value: "semester", label: "S1 2025" },
  { value: "year", label: "Ano 2025" },
];

export function Topbar() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light");
    }
    return true;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [dark]);

  return (
    <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <EntitySelector />
        <div className="hidden lg:flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="font-display font-bold text-xs text-primary-foreground">T</span>
          </div>
          <div>
            <h1 className="font-display font-semibold text-sm text-foreground leading-tight">TechBR Ltda</h1>
            <p className="text-[10px] text-muted-foreground font-data">CNPJ: 12.345.678/0001-99</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Real-time indicator */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="font-data">Atualizado há 4 min</span>
        </div>

        <GlobalSearch />

        {/* Period selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 bg-muted/50 border-border hover:bg-muted h-8 text-xs">
              <span className="font-data">Março 2025</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            {periodOptions.map((option) => (
              <DropdownMenuItem key={option.value} className="font-data text-xs">{option.label}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Modo CFO / Sócio toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs font-data hidden md:flex"
          onClick={() => {
            const body = document.documentElement;
            body.classList.toggle("modo-socio");
          }}
        >
          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">CFO</span>
          <span className="text-[10px] text-muted-foreground/50">|</span>
          <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Sócio</span>
        </Button>

        {/* Dark/Light toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
                {notifications.length}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-card border-border">
            <div className="p-2">
              <h3 className="font-display font-semibold text-sm mb-2">Notificações</h3>
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-1 py-2">
                  <span className="text-xs">{notification.message}</span>
                  <span className="text-[10px] text-muted-foreground">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-display text-xs">
                  JD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card border-border">
            <DropdownMenuItem className="font-data text-xs">
              <User className="mr-2 h-3.5 w-3.5" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="font-data text-xs text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
