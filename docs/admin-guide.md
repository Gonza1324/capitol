# Capitol Hub - Guia breve para administradores

Esta guia resume las tareas administrativas basicas para operar Capitol Hub en V1.

## Crear usuarios

1. Entrar con un usuario `admin`.
2. Ir a **Configuracion**.
3. Completar nombre, email, rol y contrasena temporal.
4. Crear el usuario.
5. Compartir credenciales por un canal seguro y pedir cambio de contrasena si el proceso interno lo define.

La administracion de usuarios usa `SUPABASE_SERVICE_ROLE_KEY` del lado servidor. Esa clave nunca debe estar en el navegador ni en archivos versionados.

## Roles

- `admin`: administra usuarios y puede operar todos los modulos internos.
- `partner_director`: usuario interno con visibilidad operativa completa.
- `analyst`: usuario interno para carga y edicion operativa.
- `assistant`: usuario interno para carga y soporte operativo.
- `external_client`: rol reservado para una version futura. No usar operativamente en V1.

## Que puede hacer un admin

- Crear usuarios internos.
- Editar nombre, email, rol y contrasena temporal.
- Cargar y editar datos operativos.
- Archivar registros.
- Revisar configuracion de rubros e issues.

## Que no esta activo en V1

- Portal de clientes.
- Honorarios.
- Integraciones con Google Calendar, Gmail, Google Drive API o WhatsApp.
- IA.
- Envio real de emails.

## Activity log

Capitol Hub registra actividad relevante en `activity_log` y la muestra en vistas como dashboard, detalles e historial de cliente cuando aplica.

Para revisiones mas profundas, un admin tecnico puede consultar la tabla `activity_log` en Supabase. No usar esta tabla como auditoria completa de accesos.

## Baja o cambio de usuarios

- Si una persona deja de usar Capitol Hub, cambiar su acceso desde Supabase Auth o desde el flujo administrativo disponible.
- Evitar compartir usuarios entre personas.
- No reasignar un mismo email a otra persona.
- Antes de quitar permisos, revisar tareas activas asignadas a ese usuario.

## Variables sensibles

- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` pueden estar expuestas al navegador.
- `SUPABASE_SERVICE_ROLE_KEY` es secreta y solo debe existir como variable server-side en Vercel o en `.env.local`.
- No subir `.env.local`, claves reales ni secretos a GitHub.
- Si hay sospecha de exposicion de una clave, rotarla en Supabase y actualizar Vercel.
