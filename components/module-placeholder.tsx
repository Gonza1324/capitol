import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Modulo interno en preparacion." />
      <Card>
        <CardHeader>
          <CardTitle>Modulo en preparacion</CardTitle>
          <CardDescription>
            Esta seccion todavia no esta disponible para uso operativo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Usa los modulos principales del menu para cargar y consultar informacion.
        </CardContent>
      </Card>
    </>
  );
}
