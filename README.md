# Capitol Hub

Capitol Hub es la plataforma interna de Capitol para centralizar clientes, contactos, tareas, interacciones, reportes, alertas, stakeholders, documentos, busqueda global e historial por cliente.

## Stack

- Next.js App Router
- TypeScript
- Supabase Auth, Postgres, Storage y RLS
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Table
- Recharts
- Vercel

## Estado actual

La app esta desplegada y lista para uso interno inicial. Cuenta con deploy automatico GitHub -> Vercel y backend Supabase.

## Modulos implementados

- Dashboard.
- Clientes y contactos.
- Tareas.
- Calendario interno.
- Interacciones.
- Reportes enviados.
- Alertas enviadas.
- Stakeholders.
- Documentos y links externos.
- Busqueda global y busquedas guardadas.
- Google Calendar externo preparado, pausado por feature flag.
- Configuracion.
- Administracion de usuarios.
- Historial completo por cliente.
- Activity log y notificaciones internas basicas.

## Fuera de V1

- Honorarios.
- Portal de clientes.
- Gmail.
- Google Drive API.
- WhatsApp.
- IA.
- Envio real de emails.

## Documentacion

- Cierre V1: [docs/v1-release-notes.md](./docs/v1-release-notes.md)
- Backlog V2: [docs/v2-backlog.md](./docs/v2-backlog.md)
- Plan de adopcion interna: [docs/internal-adoption-plan.md](./docs/internal-adoption-plan.md)
- Calendario interno: [docs/internal-calendar.md](./docs/internal-calendar.md)
- Integracion Google Calendar: [docs/google-calendar-integration.md](./docs/google-calendar-integration.md)
- Guia de uso interno: [docs/internal-user-guide.md](./docs/internal-user-guide.md)
- Guia para administradores: [docs/admin-guide.md](./docs/admin-guide.md)
- Criterios UX/UI: [docs/ui-ux-capitol-hub.md](./docs/ui-ux-capitol-hub.md)
- Deploy GitHub -> Vercel: [docs/vercel-github-deploy.md](./docs/vercel-github-deploy.md)
- Deploy staging Supabase/Vercel: [DEPLOYMENT_STAGING.md](./DEPLOYMENT_STAGING.md)

## Setup local

1. Copiar `.env.example` a `.env.local`.
2. Completar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=false
```

3. Instalar dependencias:

```bash
npm install
```

4. Levantar entorno local:

```bash
npm run dev
```

## Comandos basicos

```bash
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Seguridad operativa

- `.env.local` no debe versionarse.
- `SUPABASE_SERVICE_ROLE_KEY` es server-side y nunca debe tener prefijo `NEXT_PUBLIC_`.
- Los documentos subidos se guardan en bucket privado y se abren con signed URLs.
- El rol `external_client` esta reservado para futuro y no debe usarse operativamente en V1.
