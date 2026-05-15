# Notificaciones internas

Capitol Hub usa notificaciones internas para avisos operativos dentro de la app. No hay emails reales en esta fase.

## Centro de notificaciones

La ruta `/notifications` muestra:

- Notificaciones no leídas.
- Notificaciones leídas recientes.
- Tipo, título, descripción y fecha.
- Link a la entidad relacionada.
- Acción para marcar una notificación como leída.
- Acción para marcar todas como leídas.
- Acción manual para actualizar recordatorios.

El sidebar muestra un contador de notificaciones no leídas.

## Notificaciones automáticas actuales

### Tareas

- Tarea asignada.
- Tarea completada.
- Comentario nuevo en tarea.

### Calendario interno

- Evento asignado.
- Evento pospuesto.
- Evento cancelado.

### Reportes

- Reporte pendiente de aprobación.
- Reporte aprobado para el responsable.

### Alertas

- Alerta crítica creada.

### Stakeholders

- Stakeholder restringido creado.

## Recordatorios manuales

Como todavía no hay scheduler externo, los recordatorios por tiempo se generan desde `/notifications` con **Actualizar recordatorios**.

Esa acción crea avisos para:

- Tareas vencidas.
- Tareas próximas a vencer.
- Eventos próximos del calendario interno.
- Eventos pasados sin interacción creada.

La acción evita duplicar recordatorios ya creados para la misma entidad y tipo.

## Pendiente para futuras fases

- Scheduler/cron automático.
- Emails reales.
- Preferencias visuales por usuario.
- Resúmenes diarios o semanales enviados fuera de la app.
- Notificaciones push o integraciones externas.

## Permisos

- Cada usuario ve solo sus propias notificaciones.
- `external_client` no accede a notificaciones internas.
- Los links apuntan a entidades internas ya protegidas por las reglas existentes.
