# Capitol Hub - Backlog V2

Este backlog ordena posibles mejoras posteriores al cierre de V1. No implica compromiso de implementacion inmediata; debe priorizarse segun feedback real del equipo de Capitol.

## Prioridad alta

### Google Calendar

- Descripcion: integrar eventos de calendario para crear o vincular interacciones, fechas y participantes.
- Valor para Capitol: reduce doble carga y mejora trazabilidad de reuniones.
- Complejidad estimada: alta.
- Dependencias: OAuth Google, permisos por usuario, modelo de sincronizacion, politica de privacidad.
- Riesgos: permisos excesivos, duplicados, inconsistencias entre calendario y Hub.
- Recomendacion: empezar con vinculacion/importacion manual asistida antes de sincronizacion bidireccional.

### Gmail

- Descripcion: permitir registrar emails importantes como interacciones o evidencia vinculada a clientes.
- Valor para Capitol: captura comunicaciones relevantes hoy dispersas.
- Complejidad estimada: alta.
- Dependencias: OAuth Google, scopes de Gmail, reglas de seleccion, seguridad de datos.
- Riesgos: exposicion de emails no relacionados, exceso de informacion sensible, ruido operativo.
- Recomendacion: implementar primero seleccion explicita de emails, no ingestion automatica masiva.

### Mejoras segun feedback real del equipo

- Descripcion: ajustes de UX, filtros, campos o flujos detectados durante el primer mes de uso.
- Valor para Capitol: mejora adopcion y reduce friccion operativa.
- Complejidad estimada: baja/media.
- Dependencias: feedback documentado, priorizacion funcional.
- Riesgos: acumular cambios pequenos sin criterio comun.
- Recomendacion: agrupar feedback por modulo y resolver primero lo que impacta carga diaria.

### Permisos mas finos

- Descripcion: ajustar visibilidad o edicion por rol, modulo, cliente o sensibilidad.
- Valor para Capitol: mayor control sobre informacion sensible.
- Complejidad estimada: media/alta.
- Dependencias: definicion clara de reglas internas y cambios RLS/server-side.
- Riesgos: reglas dificiles de mantener, bloqueos accidentales a usuarios internos.
- Recomendacion: definir casos concretos antes de modificar permisos.

## Prioridad media

### Google Drive API

- Descripcion: integrar carpetas y archivos de Drive para adjuntar documentos sin copiar links manualmente.
- Valor para Capitol: reduce friccion en documentos y mejora orden de archivos.
- Complejidad estimada: alta.
- Dependencias: OAuth Google, permisos Drive, mapeo de carpetas, gestion de links.
- Riesgos: permisos amplios, duplicados, archivos fuera de contexto.
- Recomendacion: empezar con selector de archivos/carpetas y guardar metadata minima.

### Portal de clientes externos

- Descripcion: crear vista separada para clientes externos con acceso restringido a reportes, alertas y documentos aprobados.
- Valor para Capitol: canal ordenado de entrega y consulta para clientes.
- Complejidad estimada: alta.
- Dependencias: permisos por cliente, aprobaciones de visibilidad, RLS externo, UX dedicada.
- Riesgos: exposicion accidental de informacion interna, complejidad de soporte.
- Recomendacion: disenar como producto separado dentro del mismo sistema, con aprobacion explicita de contenido visible.

### Notificaciones por email reales

- Descripcion: enviar emails por eventos como tareas asignadas, vencimientos, reportes pendientes y alertas criticas.
- Valor para Capitol: mejora seguimiento fuera de la app.
- Complejidad estimada: media.
- Dependencias: proveedor de email, templates, preferencias por usuario.
- Riesgos: exceso de emails, baja calidad de notificaciones, configuracion de deliverability.
- Recomendacion: empezar con pocos eventos criticos y preferencias simples.

### Auditoria de accesos

- Descripcion: registrar accesos, lecturas sensibles y cambios criticos con mayor detalle.
- Valor para Capitol: trazabilidad sobre informacion sensible.
- Complejidad estimada: media/alta.
- Dependencias: definicion legal/operativa de auditoria, almacenamiento y retencion.
- Riesgos: volumen alto de datos, falsa sensacion de control si se implementa parcialmente.
- Recomendacion: separar activity log operativo de auditoria formal.

## Prioridad futura

### IA para resumir calls

- Descripcion: generar resumen, decisiones, riesgos y proximos pasos desde notas o transcripciones.
- Valor para Capitol: acelera carga de interacciones.
- Complejidad estimada: alta.
- Dependencias: politica de datos, proveedor IA, permisos, revision humana.
- Riesgos: errores de interpretacion, informacion sensible, confianza excesiva.
- Recomendacion: implementar como borrador revisable, nunca como registro automatico final.

### IA para convertir notas en tareas

- Descripcion: detectar proximos pasos en notas y sugerir tareas con responsables y fechas.
- Valor para Capitol: mejora seguimiento y reduce tareas olvidadas.
- Complejidad estimada: media/alta.
- Dependencias: datos de usuarios, clientes y contexto de interacciones.
- Riesgos: tareas irrelevantes o mal asignadas.
- Recomendacion: mostrar sugerencias editables antes de guardar.

### IA para redactar reportes

- Descripcion: asistir en borradores de reportes o memos desde informacion cargada.
- Valor para Capitol: acelera produccion de entregables.
- Complejidad estimada: alta.
- Dependencias: calidad de datos, prompts, control editorial, permisos.
- Riesgos: errores factuales, tono incorrecto, exposicion de informacion.
- Recomendacion: usar solo como borrador interno con revision senior.

### WhatsApp

- Descripcion: registrar o vincular comunicaciones relevantes de WhatsApp.
- Valor para Capitol: captura un canal operativo importante.
- Complejidad estimada: alta.
- Dependencias: API/WhatsApp Business, consentimiento, reglas de privacidad.
- Riesgos: compliance, datos personales, ruido de comunicaciones.
- Recomendacion: evaluar primero registro manual estructurado antes de integracion.

### Metricas avanzadas

- Descripcion: agregar indicadores de actividad, seguimiento, tiempos de respuesta, carga por usuario y salud de cliente.
- Valor para Capitol: mejora direccion y gestion del equipo.
- Complejidad estimada: media.
- Dependencias: datos consistentes, definicion de KPIs, filtros por periodo.
- Riesgos: medir volumen en vez de impacto, dashboards sobrecargados.
- Recomendacion: empezar con 5 a 8 KPIs accionables.
