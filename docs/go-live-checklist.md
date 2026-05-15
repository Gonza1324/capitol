# Capitol Hub - Checklist de go-live interno

Checklist para habilitar el primer uso interno real de Capitol Hub en Capitol.

## 1. Configuracion tecnica

- [ ] Repositorio GitHub correcto: `https://github.com/Gonza1324/capitol.git`.
- [ ] Proyecto Vercel conectado al repo.
- [ ] Deploy automatico desde `main` funcionando.
- [ ] URL activa: `https://capitol-hub.vercel.app`.
- [ ] Variables de entorno cargadas en Vercel Production:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `.env.example` no contiene secretos reales.
- [ ] `.env.local` no esta versionado.
- [ ] Build de Vercel sin errores.
- [ ] Logs de Vercel sin errores criticos.

## 2. Supabase

- [ ] Proyecto Supabase correcto conectado.
- [ ] Migraciones aplicadas.
- [ ] Tablas principales disponibles.
- [ ] RLS habilitado.
- [ ] Policies internas creadas.
- [ ] Auth Email/Password habilitado.
- [ ] Storage bucket `documents` creado.
- [ ] Bucket `documents` configurado como privado.
- [ ] Signed URLs para archivos subidos funcionando.
- [ ] Service role key guardada solo como secreto server-side.

## 3. Auth URLs

En Supabase Authentication > URL Configuration:

- [ ] Site URL configurada para `https://capitol-hub.vercel.app`.
- [ ] Redirect URL configurada para `https://capitol-hub.vercel.app/auth/callback`.
- [ ] Redirect URL local configurada para `http://localhost:3000/auth/callback`, si se usa desarrollo local.
- [ ] Previews de Vercel habilitadas solo si el equipo acepta login en previews.

## 4. Usuarios y roles

- [ ] Usuario admin inicial creado.
- [ ] Rol admin confirmado en `profiles`.
- [ ] Usuarios internos creados.
- [ ] Roles asignados:
  - [ ] admin
  - [ ] partner_director
  - [ ] analyst
  - [ ] assistant
- [ ] Usuarios `external_client` no tienen acceso a modulos internos en V1.
- [ ] Solo admin puede crear o editar usuarios desde Configuracion.
- [ ] Logout probado.

## 5. Modulos operativos

- [ ] Dashboard carga correctamente.
- [ ] Clientes: crear, editar, archivar y abrir detalle.
- [ ] Contactos: crear, editar y archivar.
- [ ] Tareas: crear, editar, comentar, completar, archivar y filtrar.
- [ ] Calls/interacciones: crear, editar, registrar participantes y crear tareas derivadas.
- [ ] Reportes: registrar, editar, marcar enviado/aprobado y crear tarea de seguimiento.
- [ ] Alertas: registrar, editar, archivar y crear tarea de seguimiento.
- [ ] Stakeholders: crear, editar, vincular a clientes y registrar interaccion.
- [ ] Documentos: cargar archivo, guardar link externo, abrir detalle y archivar.
- [ ] Busqueda global: buscar por texto y aplicar filtros.
- [ ] Busquedas guardadas: crear, ejecutar y eliminar.
- [ ] Historial de cliente: revisar timeline y filtros.

## 6. Primeros datos de prueba real

- [ ] Primer cliente real cargado.
- [ ] Primer contacto principal cargado.
- [ ] Primera tarea activa cargada.
- [ ] Primera interaccion reciente cargada.
- [ ] Primer reporte enviado cargado.
- [ ] Primera alerta enviada cargada.
- [ ] Primer stakeholder relevante cargado.
- [ ] Primer documento o link externo cargado.
- [ ] Historial del cliente revisado por un usuario interno.

## 7. Seguridad y alcance V1

- [ ] Usuario no autenticado no accede a rutas protegidas.
- [ ] `external_client` no accede a modulos internos.
- [ ] No hay UI activa de honorarios.
- [ ] No hay portal de clientes externos.
- [ ] No hay integraciones Calendar, Gmail, Drive API, WhatsApp ni IA.
- [ ] Documentos no son publicos por defecto.
- [ ] No hay secretos expuestos en GitHub.
- [ ] No se comparten credenciales por canales inseguros.

## 8. Operacion interna

- [ ] Responsable interno de soporte definido.
- [ ] Canal interno para reportar errores definido.
- [ ] Criterio de carga inicial comunicado.
- [ ] Guia de uso interno compartida.
- [ ] Checklist de carga inicial compartida.
- [ ] Backup o estrategia de recuperacion de Supabase confirmada.
- [ ] Dominio final confirmado o decision de usar dominio Vercel para prueba interna.

## 9. Decision de go-live

- [ ] Responsable tecnico aprueba configuracion.
- [ ] Responsable funcional aprueba flujo operativo.
- [ ] Equipo inicial tiene usuarios y acceso.
- [ ] Se acuerda fecha de inicio de carga real.
- [ ] Se acuerda revision posterior al primer ciclo de uso.
