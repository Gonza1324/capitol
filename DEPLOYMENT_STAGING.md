# Capitol Hub - Staging deploy

Guia para publicar Capitol Hub en Vercel usando Supabase como backend remoto de staging.

## Alcance

Este deploy no agrega funcionalidades nuevas. Solo publica la app actual y conecta un proyecto Supabase remoto.

## Variables de entorno

La aplicacion usa estas variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` se usa solo del lado servidor para crear y editar usuarios desde Configuracion. No debe exponerse como variable `NEXT_PUBLIC_` ni importarse en componentes cliente.

Tampoco se usa actualmente `APP_URL`, `NEXT_PUBLIC_APP_URL` ni `SITE_URL` desde el codigo. Las URLs de Auth se configuran en Supabase.

## Verificacion de clientes Supabase

- `lib/supabase/server.ts` usa `createServerClient` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase/middleware.ts` refresca sesion con cookies usando las mismas variables publicas.
- `lib/supabase/admin.ts` usa service role solo en server actions de administracion de usuarios.
- No hay imports de service role en componentes client-side; los componentes llaman server actions.
- RLS queda como barrera principal de acceso a datos.

## Supabase staging

1. Crear un proyecto nuevo en Supabase para staging.
2. Copiar `Project URL`.
3. Copiar `anon public key`.
4. Copiar `service_role` al proyecto Vercel como `SUPABASE_SERVICE_ROLE_KEY` para habilitar administracion de usuarios desde Configuracion.
5. Instalar e iniciar sesion en Supabase CLI si hace falta:

```bash
supabase login
```

6. Linkear el repo al proyecto remoto:

```bash
supabase link --project-ref <PROJECT_REF>
```

7. Aplicar migraciones:

```bash
supabase db push
```

Migraciones presentes en este repo:

- `001_initial_phase.sql`
- `002_client_contact_constraints.sql`
- `003_tasks_phase.sql`
- `004_interactions_phase.sql`
- `005_reports_alerts_phase.sql`
- `006_stakeholders_phase.sql`
- `007_documents_phase.sql`

8. Verificar en Supabase:

- Tablas creadas en `public`.
- RLS activo.
- Policies internas creadas.
- Buckets privados creados: `capitol-documents` historico y `documents`.
- Auth habilitado con Email/Password.

## Usuario admin inicial

1. Crear el primer usuario desde la pantalla de login o desde Supabase Auth.
2. En Supabase SQL Editor, asignarle rol admin:

```sql
update public.profiles
set role = 'admin'
where email = '<EMAIL_DEL_ADMIN>';
```

3. Verificar:

```sql
select email, role
from public.profiles
where email = '<EMAIL_DEL_ADMIN>';
```

## Auth URLs en Supabase

En Supabase Dashboard > Authentication > URL Configuration:

- Site URL:

```text
https://<vercel-staging-domain>
```

- Redirect URLs:

```text
https://<vercel-staging-domain>/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
```

La app usa `/auth/callback` para intercambiar el code por sesion y redirigir a `/dashboard`.

## Vercel staging

1. Importar el repo en Vercel.
2. Framework preset: Next.js.
3. Build command:

```bash
npm run build
```

4. Install command:

```bash
npm install
```

5. Output directory: dejar default de Next.js.
6. Cargar variables de entorno para Preview/Staging:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

7. Deploy.
8. Abrir `/login`, iniciar sesion y verificar redireccion a `/dashboard`.

## Checklist de smoke test

- Login funciona.
- Logout funciona.
- Middleware protege `/dashboard`, `/clients`, `/tasks`, `/interactions`, `/reports`, `/alerts`, `/stakeholders`, `/documents`, `/settings`.
- Se puede crear y editar cliente.
- Se puede crear tarea.
- Se puede abrir dashboard.
- RLS bloquea acceso sin usuario autenticado.
- No hay errores de variables faltantes en Vercel logs.

## Comandos locales de verificacion

```bash
npm run typecheck
npm run lint
npm run build
```
