# Capitol Hub - Guia de uso interno

Esta guia explica el uso operativo basico de Capitol Hub para el equipo interno de Capitol.

Capitol Hub es una herramienta interna. En V1 no tiene portal de clientes, integraciones con Calendar, Gmail, Drive API, WhatsApp ni IA. Los reportes, alertas, documentos y links se registran manualmente.

## 1. Iniciar sesion

1. Entrar a `https://capitol-hub.vercel.app`.
2. Usar el email y password asignados.
3. Al ingresar, la app abre el dashboard.
4. Si no podes ingresar, pedir a un usuario admin que revise tu usuario y rol en Configuracion.

## 2. Crear un cliente

1. Ir a **Clientes**.
2. Hacer click en **Nuevo cliente**.
3. Completar como minimo nombre, estado y tipo.
4. Agregar rubros, issues y responsables internos si ya estan definidos.
5. Guardar.

Buenas practicas:

- Usar nombres claros y consistentes.
- Completar razon social y CUIT/ID fiscal cuando esten validados.
- Usar la descripcion y el perfil estrategico para contexto util, no para notas dispersas.
- Archivar clientes que ya no deben estar activos en vez de duplicarlos.

## 3. Cargar contactos

1. Ir a **Contactos** o entrar a la ficha del cliente.
2. Crear un contacto asociado al cliente.
3. Completar nombre, cargo, email, WhatsApp, LinkedIn y rol en la relacion cuando aplique.
4. Marcar como contacto principal si corresponde.

Buenas practicas:

- Evitar duplicar contactos con pequenas variaciones del nombre.
- Mantener inactivos los contactos que ya no correspondan.
- Usar observaciones solo para informacion relevante para la relacion institucional.

## 4. Crear tareas

1. Ir a **Tareas**.
2. Hacer click en **Nueva tarea**.
3. Completar titulo, cliente si aplica, estado, prioridad, fecha limite y responsables.
4. Guardar.

En la lista de tareas se puede filtrar por estado, prioridad, cliente, responsable, fecha, tareas vencidas, mis tareas y tareas sin responsable.

Buenas practicas:

- El titulo debe indicar la accion concreta.
- Usar prioridad `urgent` solo para temas realmente criticos.
- Asignar responsables cuando la tarea tenga owner claro.
- Cerrar o cancelar tareas cuando dejen de estar activas.

## 5. Registrar una call o interaccion

1. Ir a **Calls**.
2. Hacer click en **Nueva interaccion**.
3. Elegir tipo: call, reunion, email importante, WhatsApp, presentacion, reunion interna u otro.
4. Asociar clientes, participantes internos y participantes externos.
5. Completar resumen, decisiones, riesgos y proximos pasos.
6. Guardar.

Los campos de link de reunion e ID de evento externo son manuales. No conectan Capitol Hub con Google Calendar.

Buenas practicas:

- Registrar las decisiones y proximos pasos apenas termina la reunion.
- Vincular todos los clientes relevantes.
- Usar tareas derivadas cuando haya acciones concretas.

## 6. Crear tareas derivadas

Desde el detalle de una interaccion, reporte o alerta:

1. Usar el bloque de tarea de seguimiento.
2. Ajustar titulo, descripcion, prioridad, fecha limite y responsables.
3. Guardar.

La tarea queda vinculada a la entidad de origen para mantener trazabilidad.

## 7. Registrar reportes enviados

1. Ir a **Reportes**.
2. Hacer click en **Nuevo reporte**.
3. Completar titulo, tipo, estado, tema, descripcion, fecha de envio, responsable, clientes y destinatarios.
4. Agregar link externo o documento si corresponde.
5. Guardar.

Capitol Hub V1 no genera ni envia reportes. Solo registra reportes enviados o preparados externamente.

## 8. Registrar alertas enviadas

1. Ir a **Alertas**.
2. Hacer click en **Nueva alerta**.
3. Completar titulo, categoria, urgencia, canal, responsable, clientes, rubros, issues y destinatarios.
4. Agregar contenido, notas y link/archivo si corresponde.
5. Guardar.

Capitol Hub V1 no envia alertas por email, WhatsApp ni otros canales. Solo registra el envio manual.

## 9. Cargar stakeholders

1. Ir a **Stakeholders**.
2. Hacer click en **Nuevo stakeholder**.
3. Completar nombre, tipo, organizacion, cargo, jurisdiccion, influencia, postura y sensibilidad.
4. Relacionar clientes y temas si aplica.
5. Guardar.

Buenas practicas:

- Ser especialmente cuidadoso con observaciones sensibles.
- Usar `restricted` solo para informacion que requiere maxima cautela.
- Mantener actualizada organizacion, cargo y jurisdiccion.

## 10. Subir documentos o links externos

1. Ir a **Documentos** o a la ficha de una entidad.
2. Hacer click en **Nuevo documento**.
3. Elegir si es archivo subido o link externo.
4. Completar nombre, tipo de documento y entidad asociada.
5. Guardar.

Los archivos subidos se guardan en Supabase Storage. Los links externos pueden apuntar a Drive, Docs, PDFs externos u otros recursos.

Buenas practicas:

- No subir documentos altamente sensibles hasta confirmar permisos y criterio interno.
- Preferir links externos cuando el documento ya vive en un repositorio oficial.
- Nombrar documentos con fecha o contexto cuando ayude a encontrarlos.

## 11. Usar busqueda global

1. Ir a **Busqueda**.
2. Escribir una palabra clave.
3. Filtrar por tipo de entidad, cliente, responsable, fecha, estado, prioridad, urgencia, categoria, rubro o issue.
4. Abrir el resultado correspondiente.
5. Guardar la busqueda si se va a usar frecuentemente.

La busqueda incluye clientes, contactos, tareas, interacciones, reportes, alertas, stakeholders y documentos. No incluye honorarios.

## 12. Consultar historial de un cliente

1. Ir a **Clientes**.
2. Abrir la ficha del cliente.
3. Revisar el resumen ejecutivo y la seccion de historial.
4. Usar filtros para ver interacciones, tareas, reportes, alertas, documentos, stakeholders o actividad.

Esta vista responde a la pregunta: "que se trabajo con este cliente".

## 13. Archivar registros

Cuando un registro ya no debe estar activo:

1. Abrir el listado o detalle.
2. Usar la accion **Archivar**.
3. Confirmar la accion.

Archivar no es borrado fisico. Sirve para conservar trazabilidad sin mostrar el registro como operativo.

## 14. Buenas practicas generales

- Cargar informacion validada.
- Evitar duplicados.
- Usar nombres consistentes para clientes, contactos y stakeholders.
- Completar responsables y fechas cuando haya seguimiento.
- Mantener resumenes breves, claros y accionables.
- Registrar decisiones y proximos pasos en interacciones.
- No usar Capitol Hub para informacion personal irrelevante.
- No compartir accesos ni credenciales.
- Consultar a un admin ante dudas de permisos o informacion sensible.
