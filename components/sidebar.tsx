import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/server";

function userLabelFromProfile(fullName?: string | null, email?: string | null) {
  const fallback = email?.split("@")[0] || "Usuario";
  return fullName?.trim() || fallback;
}

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null)
  ]);
  const displayName = userLabelFromProfile(profile?.full_name, profile?.email || user.email);

  return (
    <aside className="flex w-full flex-col border-r border-white/10 bg-[#111111] md:sticky md:top-0 md:h-screen md:max-h-screen md:self-start md:overflow-hidden md:w-60">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        <Image
          src="/capitol-logo-white.png"
          alt="Capitol"
          width={800}
          height={201}
          priority
          className="h-auto w-44"
        />
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0 flex-1 rounded-md px-2 py-1.5 text-sm font-semibold text-white">
          <span className="block truncate">{displayName}</span>
        </div>
        <Link
          href="/settings"
          aria-label="Configuracion"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <Link
          href="/notifications"
          aria-label="Notificaciones"
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-capitol-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#111111]"
        >
          <Bell className="h-4 w-4" />
          {unreadCount ? (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-capitol-accent" aria-hidden="true" />
          ) : null}
        </Link>
      </div>
      <SidebarNav />
    </aside>
  );
}
