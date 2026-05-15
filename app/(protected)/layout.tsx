import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };

  if (profile?.role === "external_client") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acceso interno no habilitado</CardTitle>
            <CardDescription>Capitol Hub V1 esta disponible solo para usuarios internos de Capitol.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Si necesitas acceso, contacta a un administrador interno.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[15rem_1fr]">
      <Sidebar />
      <main className="min-w-0">
        <div className="w-full px-4 py-5 md:px-5 lg:px-6">{children}</div>
      </main>
    </div>
  );
}
