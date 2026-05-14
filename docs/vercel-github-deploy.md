# Deploy automatico GitHub - Vercel

Guia para conectar Capitol Hub con Vercel y habilitar deploys automaticos desde GitHub.

## Estado actual

- Repositorio: `https://github.com/Gonza1324/capitol.git`
- Deploy actual: `https://capitol-hub.vercel.app`
- Framework: Next.js con App Router
- Root directory: raiz del repo
- Build command: default de Vercel para Next.js, equivalente a `npm run build`
- Output directory: default de Next.js

El proyecto ya puede compilar desde archivos versionados. No depende de `.env.local`, `.vercel`, `.next` ni otros archivos locales para el build, siempre que las variables de entorno esten cargadas en Vercel.

## Archivos necesarios en GitHub

Deben estar versionados:

- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.mjs`
- `eslint.config.mjs`
- `app/`
- `components/`
- `lib/`
- `middleware.ts`
- `public/`
- `supabase/migrations/`
- `README.md`
- `.env.example`

No deben estar versionados:

- `.env`
- `.env.local`
- `.env.*` con valores reales
- claves privadas
- `SUPABASE_SERVICE_ROLE_KEY` real
- secretos de Vercel
- `node_modules/`
- `.next/`
- `.vercel/`
- `*.tsbuildinfo`

## Conectar GitHub con Vercel

1. Entrar a Vercel.
2. Ir a **Add New Project**.
3. Elegir **Import Git Repository**.
4. Conectar GitHub si Vercel todavia no tiene acceso.
5. Seleccionar el repo `Gonza1324/capitol`.
6. Verificar la configuracion del proyecto:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: default, o `npm run build`
   - Install Command: default, o `npm install`
   - Output Directory: default
7. Cargar variables de entorno en **Project Settings -> Environment Variables**.
8. Crear el proyecto o guardar la configuracion.
9. Ejecutar el primer deploy automatico desde Vercel.

Si el proyecto de Vercel ya existe, usar **Project Settings -> Git** para conectar el repositorio `Gonza1324/capitol` al proyecto actual en vez de crear uno nuevo.

## Variables de entorno

Variables usadas realmente por el codigo:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Notas:

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` pueden exponerse al navegador. Supabase RLS protege el acceso a datos.
- `SUPABASE_SERVICE_ROLE_KEY` es secreta. Nunca debe tener prefijo `NEXT_PUBLIC_`.
- `SUPABASE_SERVICE_ROLE_KEY` se usa solo del lado servidor para crear y editar usuarios desde Configuracion.
- No cargar valores reales en GitHub ni en archivos versionados.
- Cargar las variables en Vercel para `Production`.
- Cargarlas tambien en `Preview` si se van a probar Pull Requests o branches con login y datos reales/staging.

El codigo no usa actualmente `NEXT_PUBLIC_APP_URL`, `APP_URL` ni `SITE_URL`. Las URLs de autenticacion se configuran en Supabase Auth.

## Flujo recomendado

- `main`: deploy principal de prueba/staging.
- Branches de trabajo: generan Preview Deployments en Vercel.
- Pull Request: revisar el Preview Deployment antes de mergear.
- Merge a `main`: dispara deploy automatico a `https://capitol-hub.vercel.app`.

Por ahora `https://capitol-hub.vercel.app` funciona como entorno de prueba/staging hasta definir un dominio productivo final.

## Dominio y alias

- Deploy actual: `https://capitol-hub.vercel.app`
- No cambiar dominio en este paso.
- Cuando Capitol defina dominio final, configurarlo desde Vercel en **Project Settings -> Domains**.

## Supabase Auth URLs

Al conectar deploy automatico, revisar en Supabase:

- **Authentication -> URL Configuration -> Site URL**
- **Authentication -> URL Configuration -> Redirect URLs**

Recomendado:

```text
https://capitol-hub.vercel.app/**
http://localhost:3000/**
```

Si se va a permitir login en Preview Deployments de Vercel, agregar tambien el patron de previews correspondiente. Ejemplo:

```text
https://*.vercel.app/**
```

Usar previews con acceso a datos reales solo si el equipo acepta ese alcance de seguridad.

## Checklist post-conexion

- GitHub conectado en Vercel.
- Repo correcto seleccionado: `Gonza1324/capitol`.
- Variables cargadas en Production.
- Variables cargadas en Preview, si se usaran previews.
- Primer deploy automatico exitoso.
- Preview deploy creado desde branch o Pull Request.
- Login funciona.
- Dashboard carga.
- CRUD basico de clientes funciona.
- No hay errores en Vercel logs.
- No hay secretos expuestos en GitHub.

## Comandos utiles

Validacion local antes de mergear:

```bash
npm run typecheck
npm run lint
npm run build
```

Ver remotos de Git:

```bash
git remote -v
```
