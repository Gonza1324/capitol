import Image from "next/image";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import { createClient } from "@/lib/supabase/server";

export async function Sidebar() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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
      <SidebarNav />
      <div className="shrink-0 border-t border-white/10 p-4">
        <p className="truncate text-xs text-white/55">{user.email}</p>
        <form action="/auth/sign-out" method="post" className="mt-3">
          <Button variant="outline" size="sm" className="w-full border-white/15 bg-transparent text-white/75 hover:bg-white/10 hover:text-white">
            Salir
          </Button>
        </form>
      </div>
    </aside>
  );
}
