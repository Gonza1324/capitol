"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  Contact,
  FileText,
  Gauge,
  Library,
  Search,
  Settings,
  SquareCheckBig,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/clients", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/contacts", label: "Contactos", icon: Contact },
  { href: "/tasks", label: "Tareas", icon: SquareCheckBig },
  { href: "/interactions", label: "Calls", icon: CalendarClock },
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
    <nav className="flex-1 space-y-1 p-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Button
            key={item.href}
            asChild
            variant="ghost"
            className={cn(
              "h-9 w-full justify-start gap-3 px-3 text-white/72 hover:bg-white/10 hover:text-white",
              active && "bg-capitol-accent text-primary hover:bg-capitol-accent hover:text-primary"
            )}
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
