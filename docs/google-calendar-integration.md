# Google Calendar — Integración V2

Esta integración permite que cada usuario interno conecte su propio Google Calendar para leer eventos, asociarlos a clientes y crear interacciones en Capitol Hub.

No incluye Gmail, Google Drive API, Google Docs API, envío de emails ni sincronización avanzada en background.

## Configuración en Google Cloud

1. Crear o seleccionar un proyecto en Google Cloud Console.
2. Habilitar **Google Calendar API**.
3. Configurar **OAuth consent screen**.
4. Crear un **OAuth Client ID** de tipo Web application.
5. Agregar redirect URI de producción:

```text
https://capitol-hub.vercel.app/api/google/calendar/callback
```

6. Agregar redirect URI local:

```text
http://localhost:3000/api/google/calendar/callback
```

7. Copiar `Client ID` y `Client Secret`.
8. Cargar variables en Vercel y en `.env.local`.
9. Hacer redeploy del proyecto en Vercel para que las variables queden disponibles en runtime.

## Variables de entorno

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=false
```

Notas:

- `GOOGLE_CLIENT_SECRET` es secreto y nunca debe tener prefijo `NEXT_PUBLIC_`.
- `GOOGLE_REDIRECT_URI` debe coincidir exactamente con el redirect URI configurado en Google Cloud.
- `NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=true` activa visualmente la integración externa.
- Si `NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED` está ausente o en `false`, Calendar queda oculto/desactivado y la app no debería romperse.
- Estado actual: la integración externa con Google Calendar queda preparada para futuro, pero pausada por feature flag.

## Scopes usados

```text
openid
email
profile
https://www.googleapis.com/auth/calendar.readonly
```

La integración usa acceso de solo lectura a Calendar. Capitol Hub no crea ni edita eventos de Google Calendar en esta primera iteración.

## Flujo de uso

1. El usuario entra a **Configuración**.
2. Hace click en **Conectar Google Calendar**.
3. Autoriza el acceso en Google.
4. Vuelve a Capitol Hub.
5. Sincroniza eventos desde **Configuración** o `/calendar`.
6. Desde `/calendar`, puede asociar eventos a clientes.
7. Desde `/calendar`, puede crear una interacción a partir de un evento.

## Datos guardados

Se agregan dos tablas:

- `google_calendar_connections`: conexión OAuth por usuario.
- `google_calendar_events`: eventos sincronizados y sus asociaciones con clientes/interacciones.

Los tokens se guardan server-side y no se exponen al navegador. El acceso a conexiones queda limitado al usuario dueño de la conexión mediante RLS.

## Limitaciones de esta versión

- No hay sincronización automática en background.
- No hay webhooks/push notifications de Google Calendar.
- No se crean ni editan eventos en Google Calendar desde Capitol Hub.
- No hay detección automática avanzada de cliente.
- No hay Gmail ni lectura de emails.

## Verificación básica

1. Confirmar variables en Vercel.
2. Aplicar migración `008_google_calendar_phase.sql` en Supabase.
3. Redeployar en Vercel.
4. Entrar con un usuario interno.
5. Conectar una cuenta desde Configuración.
6. Sincronizar eventos.
7. Asociar un evento a un cliente.
8. Crear una interacción desde un evento.
9. Ver el evento en la ficha del cliente y la asociación en el detalle de interacción.

## Troubleshooting básico

- Si no aparece el acceso a Calendar, revisar `NEXT_PUBLIC_GOOGLE_CALENDAR_ENABLED=true`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` en Vercel.
- Si Google muestra `redirect_uri_mismatch`, revisar que `GOOGLE_REDIRECT_URI` coincida con el redirect URI cargado en Google Cloud.
- Si la conexión vuelve con error, revisar que la Calendar API esté habilitada y que el OAuth consent screen esté configurado.
- Si sincronizar no trae eventos, confirmar que el usuario haya autorizado el scope de Calendar y que existan eventos entre los últimos 30 días y los próximos 90 días.
- Si un usuario `external_client` intenta acceder, no debe poder operar la integración en V1/V2 interna.
