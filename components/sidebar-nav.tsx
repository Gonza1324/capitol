"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  ChevronDown,
  Contact,
  FileText,
  Library,
  Search,
  SquareCheckBig,
  type LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const topItems = [
  { href: "/clients", label: "Clientes", icon: BriefcaseBusiness },
  { href: "/tasks", label: "Tareas", icon: SquareCheckBig },
  { href: "/documents", label: "Entregables", icon: Library }
];

const contactItems = [
  { href: "/contacts", label: "Contactos de Clientes" },
  { href: "/stakeholders", label: "Contactos Externos" }
];

const bottomItems = [
  { href: "/interactions", label: "Reuniones", icon: CalendarClock },
  { href: "/internal-calendar", label: "Calendario", icon: CalendarDays },
  { href: "/reports", label: "Reportes", icon: FileText },
  { href: "/alerts", label: "Alertas", icon: Bell },
  { href: "/search", label: "Busqueda", icon: Search }
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  active
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-[#EDEDE8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
        active && "bg-capitol-accent text-[#111111] hover:bg-capitol-accent hover:text-[#111111]"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#111111]" : "text-[#D8D8D2]")} />
      <span className={cn(active ? "text-[#111111]" : "text-[#EDEDE8] group-hover:text-white")}>
        {label}
      </span>
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const contactsActive = contactItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  const [contactsOpen, setContactsOpen] = useState(contactsActive);

  useEffect(() => {
    if (contactsActive) {
      setContactsOpen(true);
    }
  }, [contactsActive]);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2">
      {topItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={active}
          />
        );
      })}

      <div>
        <button
          type="button"
          aria-expanded={contactsOpen}
          onClick={() => setContactsOpen((open) => !open)}
          className={cn(
            "group flex h-9 w-full items-center gap-3 rounded-md px-3 text-sm font-medium text-[#EDEDE8] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
            contactsActive && "bg-capitol-accent text-[#111111] hover:bg-capitol-accent hover:text-[#111111]"
          )}
        >
          <Contact className={cn("h-4 w-4 shrink-0", contactsActive ? "text-[#111111]" : "text-[#D8D8D2]")} />
          <span className={cn("flex-1 text-left", contactsActive ? "text-[#111111]" : "text-[#EDEDE8] group-hover:text-white")}>
            Contactos
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              contactsOpen && "rotate-180",
              contactsActive ? "text-[#111111]" : "text-[#D8D8D2] group-hover:text-white"
            )}
          />
        </button>

        {contactsOpen ? (
          <div className="ml-7 mt-1 space-y-1 border-l border-white/10 pl-3">
            {contactItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-xs font-medium text-[#D8D8D2] transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]",
                    active && "bg-white/10 text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>

      {bottomItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={active}
          />
        );
      })}
    </nav>
  );
}
