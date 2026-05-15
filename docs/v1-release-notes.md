# Capitol Hub - Cierre V1

Fecha de cierre V1: 15/05/2026.

## Estado general

Capitol Hub V1 queda cerrada como primera version operativa interna para Capitol.

La aplicacion esta implementada, desplegada en Vercel, conectada a Supabase y lista para uso interno inicial con datos reales. El alcance esta enfocado en centralizar informacion, registrar actividad operativa y consultar historial por cliente.

## Modulos implementados

- Auth y layout protegido.
- Dashboard.
- Clientes.
- Contactos.
- Tareas.
- Interacciones.
- Reportes enviados.
- Alertas enviadas.
- Stakeholders.
- Documentos y links externos.
- Busqueda global.
- Busquedas guardadas.
- Configuracion.
- Administracion de usuarios.
- Historial completo por cliente.
- Supabase Storage.
- Activity log.
- Notificaciones internas basicas.
- Deploy automatico GitHub -> Vercel.

## Funcionalidades principales

- Login con Supabase Auth.
- Roles internos: `admin`, `partner_director`, `analyst`, `assistant`.
- Rol `external_client` reservado para futuro y bloqueado para uso operativo V1.
- CRUD operativo de clientes, contactos, tareas, interacciones, reportes, alertas, stakeholders y documentos.
- Asociacion de entidades a clientes.
- Tareas con responsables, prioridad, fecha limite, comentarios y vista Kanban/lista.
- Interacciones con participantes internos, externos y tareas derivadas.
- Registro manual de reportes y alertas enviados.
- Documentos privados en Supabase Storage y links externos.
- Busqueda global sobre los modulos principales.
- Historial consolidado por cliente.
- Configuracion de usuarios, rubros e issues.

## Fuera de V1

- Honorarios.
- Portal de clientes externos.
- Google Calendar.
- Gmail.
- Google Drive API.
- WhatsApp.
- IA.
- Envio real de emails.
- Auditoria completa de accesos.

## Requisitos para uso interno

- Variables de entorno cargadas en Vercel.
- Proyecto Supabase activo con migraciones aplicadas.
- Auth URLs configuradas.
- Bucket privado `documents` disponible.
- Usuario admin creado.
- Usuarios internos creados y con roles asignados.
- Criterio interno de carga comunicado al equipo.

## Limitaciones conocidas

- Los reportes y alertas se registran manualmente; la app no los envia.
- Los links externos a Drive/Docs se guardan como URL; no hay integracion con Google Drive API.
- Las notificaciones internas son basicas y no envian email.
- El activity log registra eventos relevantes, pero no reemplaza una auditoria completa de accesos.
- `external_client` existe como rol preparado, pero no tiene portal operativo.
- El modelo mantiene tablas preparadas para honorarios, pero la UI de honorarios esta fuera de V1.

## Recomendaciones de operacion

- Cargar primero clientes activos y sus contactos principales.
- Registrar cada interaccion relevante con resumen y proximos pasos.
- Convertir proximos pasos en tareas asignadas.
- Asociar reportes, alertas, documentos y stakeholders al cliente correcto.
- Usar nombres consistentes para facilitar busqueda.
- Archivar registros que ya no esten activos en vez de duplicarlos.
- Revisar feedback real del equipo antes de priorizar V2.
