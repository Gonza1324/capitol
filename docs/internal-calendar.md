# Calendario interno

El calendario interno de Capitol Hub permite organizar agenda operativa sin depender de Google Calendar.

## Qué se puede agendar

- Llamadas.
- Reuniones.
- Reuniones internas.
- Recordatorios.
- Seguimientos.
- Vencimientos de reportes o alertas.
- Otros eventos internos.

Los eventos pueden asociarse opcionalmente a clientes, contactos, stakeholders y tareas.

## Relación con tareas

Las tareas con `due_date` aparecen en el calendario como vencimientos de tipo `task_deadline`.

Para evitar duplicaciones, esos vencimientos no se copian automáticamente a `internal_calendar_events`: la vista combina eventos internos y tareas con fecha límite.

## Crear eventos

Desde **Calendario** se puede crear un evento con:

- Título.
- Tipo.
- Estado.
- Fecha y hora de inicio.
- Fecha y hora de fin.
- Ubicación o link de reunión.
- Cliente, contacto, stakeholder o tarea asociada.
- Responsable.
- Recurrencia simple guardada como regla.

La recurrencia permite generar ocurrencias manualmente desde el detalle del evento para los próximos 30, 60 o 90 días. No hay cron ni generación automática en segundo plano.

## Recurrencias internas

Las tareas y eventos recurrentes pueden usar reglas simples:

- `daily`
- `weekly`
- `monthly`
- `custom`, entendido como cada N días.

Cada ocurrencia generada queda como un registro independiente, editable y cancelable, pero mantiene relación con la serie original. La app evita duplicar ocurrencias para la misma fecha cuando se vuelve a generar el mismo rango.

## Crear interacciones desde eventos

Desde el detalle de un evento interno se puede crear una interacción.

La interacción toma:

- Título del evento.
- Descripción.
- Fecha y horario.
- Ubicación o link de reunión.
- Cliente asociado.
- Contacto o stakeholder asociado como participante externo.

Después de crearla, el evento guarda `interaction_id`.

## En clientes y dashboard

En la ficha del cliente se muestran:

- Próximos eventos internos.
- Eventos recientes.
- Eventos pendientes de interacción.
- Tareas vinculadas cuando corresponda.

En el dashboard se muestran:

- Eventos internos de hoy.
- Próximos eventos internos.
- Eventos vencidos o pendientes.

## Preparación para Google Calendar futuro

La tabla `internal_calendar_events` incluye campos preparados para futura sincronización:

- `source`
- `external_provider`
- `external_event_id`
- `external_calendar_id`
- `sync_status`
- `last_synced_at`

En una fase futura, Google Calendar debería sincronizar contra el calendario interno, en vez de funcionar como una agenda paralela.

## Qué no está implementado todavía

- Drag & drop.
- Sincronización real con Google Calendar.
- Creación o edición de eventos en Google Calendar.
- Webhooks o background sync.
- Invitaciones por email.
- Recurrencia con generación automática de ocurrencias mediante scheduler.
