import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
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
import { createClient } from "@/lib/supabase/server";
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

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <aside className="flex min-h-screen w-full flex-col border-r bg-card md:w-60">
      <div className="flex h-16 items-center border-b bg-primary px-4">
        <Image
          src="/capitol-logo-white.png"
          alt="Capitol"
          width={800}
          height={201}
          priority
          className="h-auto w-44"
        />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {items.map((item) => (
          <Button key={item.href} asChild variant="ghost" className={cn("w-full justify-start gap-3")}>
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="border-t p-4">
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        <form action="/auth/sign-out" method="post" className="mt-3">
          <Button variant="outline" size="sm" className="w-full">
            Salir
          </Button>
        </form>
      </div>
    </aside>
  );
}
