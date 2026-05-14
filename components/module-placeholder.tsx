import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} description="Ruta base preparada para la V1." />
      <Card>
        <CardHeader>
          <CardTitle>Modulo preparado</CardTitle>
          <CardDescription>
            La estructura queda lista para conectar tablas, filtros y flujos especificos en la siguiente iteracion.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Sin integraciones externas, portal de clientes ni automatizaciones en esta fase.
        </CardContent>
      </Card>
    </>
  );
}
