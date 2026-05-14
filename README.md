# Capitol Hub

Primera fase de Capitol Hub: base interna con Supabase, Auth, RLS, layout protegido y CRUD iniciales.

## Setup

1. Copiar `.env.example` a `.env.local`.
2. Completar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Completar `SUPABASE_SERVICE_ROLE_KEY` solo en entornos server-side para poder crear y editar usuarios desde Configuracion.
4. Ejecutar la migracion en `supabase/migrations/001_initial_phase.sql`.
5. Correr `npm run dev`.

Para staging en Vercel + Supabase remoto, ver [DEPLOYMENT_STAGING.md](./DEPLOYMENT_STAGING.md).

## Alcance de esta fase

- Auth con Supabase email/password.
- Layout protegido para usuarios autenticados.
- CRUD operativo de clientes, contactos y tareas.
- Modulo avanzado inicial de clientes con rubros, intereses y responsables internos.
- Administracion de usuarios desde Configuracion para usuarios `admin`.
- RLS por membresia de organizacion.

No incluye integraciones externas ni portal de clientes.

## Fuera de V1

- Honorarios queda fuera del alcance operativo de V1. La tabla `client_fees` puede existir en Supabase por compatibilidad con migraciones previas, pero la UI y las acciones de gestion de honorarios no se exponen en la aplicacion.

## Fase 2

- Listado filtrable de clientes con TanStack Table.
- Formularios de clientes/contactos con React Hook Form y Zod.
- Detalle de cliente con resumen, contactos, rubros, intereses y responsables.
- Configuracion minima de rubros e intereses.
- Activity log para cambios importantes.

## Fase 3

- Modulo completo de tareas internas con lista, Kanban y detalle.
- Responsables multiples, comentarios, actividad y notificaciones internas al asignar.
- Tareas conectadas a ficha de cliente y dashboard con metricas reales.
- Modelo preparado para recurrencia simple sin generar ocurrencias automaticamente.

## Fase 4

- Modulo de calls/interacciones con listado filtrable, creacion, edicion y detalle.
- Clientes multiples, participantes internos y participantes externos flexibles.
- Tareas derivadas desde interacciones con `origin_type = interaction`.
- Interacciones conectadas a ficha de cliente y dashboard con metricas por tipo.

## Fase 5

- Modulos de reportes enviados y alertas enviadas con listado filtrable, formularios y detalle.
- Clientes, destinatarios, responsables, links externos y metadatos de envio.
- Tareas de seguimiento con `origin_type = report` o `origin_type = alert`.
- Reportes y alertas conectados a ficha de cliente y dashboard.
