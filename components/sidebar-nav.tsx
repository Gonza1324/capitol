"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Contact,
  FileText,
  Gauge,
  Library,
  Search,
  Settings,
  SquareCheckBig,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/clients", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/contacts", label: "Contactos", icon: Contact },
  { href: "/tasks", label: "Tareas", icon: SquareCheckBig },
  { href: "/interactions", label: "Interacciones", icon: CalendarClock },
  { href: "/internal-calendar", label: "Calendario", icon: CalendarDays },
  { href: "/reports", label: "Reportes", icon: FileText },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/stakeholders", label: "Stakeholders", icon: Users },
  { href: "/documents", label: "Documentos", icon: Library },
  { href: "/search", label: "Busqueda", icon: Search },
  { href: "/settings", label: "Configuracion", icon: Settings }
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-[#EDEDE8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
              active && "bg-capitol-accent text-[#111111] hover:bg-capitol-accent hover:text-[#111111]"
            )}
          >
            <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-[#111111]" : "text-[#D8D8D2]")} />
            <span className={cn(active ? "text-[#111111]" : "text-[#EDEDE8] group-hover:text-white")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
