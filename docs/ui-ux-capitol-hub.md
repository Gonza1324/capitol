# Capitol Hub — Tratado breve de UX/UI

Referencia visual: sitio publico de Capitol, `https://capitolpac.com/`, logo cargado en `/public/capitol-logo-white.png` y favicon cargado en `/public/favicon.png`.

Este documento es una guia de criterio. No implica aplicar cambios visuales automaticamente. Cualquier ajuste de UI deberia hacerse por fases pequenas, revisables y sin alterar reglas de negocio.

## 1. Principios visuales

- Institucional, no informal.
- Ejecutivo, no recargado.
- Claro, no decorativo.
- Operativo, no marketinero.
- Sobrio, pero moderno.
- Pensado para lectura rapida, seguimiento interno y toma de decisiones.
- Con suficiente densidad para trabajo diario, sin perder jerarquia visual.

Capitol Hub no debe sentirse como una landing page. Debe sentirse como una herramienta interna de direccion, seguimiento y memoria institucional.

## 2. Personalidad de interfaz

La app debe sentirse:

- Confiable.
- Ordenada.
- Estrategica.
- Profesional.
- Discreta.
- Agil.
- Segura.

Evitar que se sienta:

- Demasiado startup generica.
- Demasiado colorida.
- Infantil.
- Excesivamente tecnica.
- Cargada visualmente.
- Promocional o marketinera.

El tono debe acompanar una consultora de asuntos publicos y corporativos: estrategia, regulacion, reputacion, stakeholders, seguimiento politico/institucional y decisiones ejecutivas.

## 3. Paleta de color propuesta

La web publica y los assets cargados sugieren una identidad basada en blanco, negro/grises y un acento verde-lima. El favicon permite aproximar el acento a `#E0E200`. Esta paleta debe validarse visualmente contra la identidad final antes de aplicarse en produccion.

Tokens propuestos para una app interna:

| Token | Hex sugerido | Uso |
| --- | --- | --- |
| `capitol-background` | `#F7F7F4` | Fondo principal, levemente calido pero neutral. |
| `capitol-surface` | `#FFFFFF` | Cards, tablas, formularios. |
| `capitol-surface-muted` | `#F1F1EC` | Filtros, headers de tabla, areas secundarias. |
| `capitol-sidebar` | `#111111` | Sidebar y zonas institucionales de alto contraste. |
| `capitol-primary` | `#111111` | Acciones primarias, texto fuerte, elementos base. |
| `capitol-primary-muted` | `#2A2A2A` | Hover/active de sidebar y botones oscuros. |
| `capitol-accent` | `#E0E200` | Acento institucional, foco medido, estados destacados. |
| `capitol-accent-muted` | `#F4F5B8` | Fondos suaves de badges o llamadas discretas. |
| `capitol-border` | `#DEDED8` | Bordes suaves. |
| `capitol-text` | `#151515` | Texto principal. |
| `capitol-text-muted` | `#6F6F68` | Texto secundario. |

Estados recomendados:

| Estado | Hex sugerido | Criterio |
| --- | --- | --- |
| `success` | `#167A4A` | Completado, enviado, activo positivo. |
| `warning` | `#B7791F` | Pendiente, revision, alto seguimiento. |
| `danger` | `#B42318` | Vencido, critico, restringido. |
| `info` | `#315C7C` | Informacion neutral, contexto o eventos. |

Regla general: usar el acento Capitol con moderacion. No convertir toda la interfaz en verde-lima. Debe funcionar como senal institucional y punto de atencion, no como fondo dominante.

## 4. Tipografia

El estilo debe ser claro y ejecutivo:

- Titulos de pagina: fuertes, directos, sin grandilocuencia.
- Texto de lectura: comodo, con buen contraste y line-height estable.
- Labels: compactos, consistentes y utiles.
- Tablas: densas pero legibles.
- Badges: cortos, escaneables y sin exceso de mayusculas.
- Evitar titulos heroicos o tamanos excesivos dentro de la app.
- Evitar mayusculas innecesarias salvo en pequenos labels tecnicos o metadatos.

Si el proyecto mantiene la fuente default del sistema, es aceptable para V1: mejora performance, legibilidad y neutralidad. Una futura fase puede evaluar una fuente institucional, pero no es prioritario frente a consistencia, contraste y densidad operativa.

## 5. Layout

Lineamientos:

- Sidebar sobria, compacta y claramente institucional.
- Mucho ancho util para tablas, historial y busqueda.
- Header de pagina claro: titulo, descripcion breve y accion principal.
- Cards con bordes suaves, radios contenidos y poca sombra.
- Separacion clara entre informacion estrategica y operativa.
- Dashboard sobrio: menos decoracion, mas lectura ejecutiva.
- Navegacion rapida y predecible.
- Evitar secciones flotantes decorativas y cards dentro de cards.

La app debe priorizar productividad: encontrar, actualizar y revisar informacion sin friccion.

## 6. Componentes

### Sidebar

- Fondo oscuro o casi negro.
- Logo blanco arriba, sin competir con la navegacion.
- Items compactos, con icono y texto.
- Estado activo claro, idealmente con acento discreto.
- Email/logout secundarios, sin ocupar demasiado espacio.

### Page headers

- Titulo directo.
- Descripcion breve, sin texto explicativo excesivo.
- Accion principal a la derecha.
- Mantener altura contenida para ganar espacio vertical.

### Cards

- Usar para bloques de informacion reales.
- Bordes suaves y fondo blanco.
- Evitar sombras fuertes.
- Evitar nesting innecesario.

### Tables

- Densas, legibles y escaneables.
- Columnas importantes con ancho suficiente.
- Acciones compactas con iconos.
- Headers sobrios.
- Evitar wrap extremo en columnas clave.

### Filters

- Siempre cerca del listado.
- Campos compactos.
- Boton claro para limpiar filtros.
- No transformar filtros en una pantalla aparte.

### Forms

- Secciones claras.
- Labels simples.
- Validaciones visibles y concretas.
- Evitar formularios visualmente largos si pueden agruparse.

### Badges

- Usar color para prioridad, urgencia, sensibilidad y estado.
- Mantener una paleta limitada.
- No depender solo del color: el texto del badge debe ser claro.

### Tabs

- Claras, de baja friccion.
- Priorizar Resumen, Historial y entidades relacionadas.
- Evitar tabs vacias o secciones sin uso operativo.

### Buttons

- Primario: acciones de creacion o confirmacion.
- Secundario: navegacion o acciones menos frecuentes.
- Destructivo: archivar/eliminar/cancelar, siempre con confirmacion cuando corresponda.
- Iconos lucide cuando ayudan a reconocer la accion.

### Empty states

- Breves, utiles y accionables.
- No usar tono jugueton.
- Siempre que aplique, incluir boton para crear o limpiar filtros.

### Timeline / historial

- Debe favorecer memoria institucional.
- Eventos ordenados de mas reciente a mas antiguo.
- Tipo de evento, fecha, responsable/contexto y link al detalle.
- Evitar colores excesivos por evento.

### Document cards

- Mostrar tipo, origen, entidad asociada, fecha y accion de abrir.
- Distinguir archivo subido de link externo.
- Priorizar acceso rapido.

### Search results

- Tipo de entidad visible.
- Titulo principal dominante.
- Subtitulo con contexto.
- Badges utiles, no decorativos.
- Fecha relevante.
- Link al detalle.

## 7. Modulos clave

### Dashboard

Debe sentirse como panel ejecutivo:

- Metricas principales.
- Actividad reciente.
- Tareas criticas.
- Clientes que requieren atencion.
- Graficos sobrios.
- Evitar saturacion de colores o charts innecesarios.

### Clientes

Debe sentirse como ficha estrategica:

- Resumen claro.
- Estado visible.
- Responsables.
- Issues y rubros.
- Ultima actividad.
- Historial facil de recorrer.

### Tareas

Debe priorizar operacion:

- Vencimientos.
- Responsables.
- Estado.
- Prioridad.
- Acciones rapidas sin perder claridad.

### Interacciones

Debe priorizar memoria institucional:

- Que se hablo.
- Que se decidio.
- Riesgos.
- Proximos pasos.
- Tareas derivadas.

### Reportes y alertas

Debe priorizar trazabilidad:

- Que se envio.
- A quien.
- Cuando.
- Por que canal.
- Que seguimiento quedo.

### Stakeholders

Debe priorizar sensibilidad:

- Influencia.
- Postura.
- Jurisdiccion.
- Nivel de sensibilidad.
- Relacion con clientes o temas.

### Documentos

Debe priorizar acceso rapido:

- Tipo.
- Entidad asociada.
- Origen.
- Fecha.
- Link o archivo.

## 8. Estados y badges

Criterios:

- Estados de cliente: usar neutros con pequenas variaciones; `active` debe ser claro y positivo, `archived` debe ser apagado.
- Estados de tarea: no usar demasiados colores; `completed` positivo, `cancelled` apagado/advertencia, vencidas en danger.
- Prioridades: `urgent` debe destacarse, `high` visible pero menos agresivo, `medium/low` sobrios.
- Urgencias de alertas: `critical` danger claro, `high` warning fuerte, `medium/low` contenidos.
- Sensibilidad de stakeholders: `restricted` danger, `high` warning, resto neutro.
- Tipos de reportes/alertas/documentos: preferir badges neutros para clasificar, no para alarmar.

Regla: no usar mas de 4-5 colores semanticos recurrentes. La consistencia importa mas que la variedad.

## 9. Accesibilidad y legibilidad

- Buen contraste entre texto y fondo.
- No depender solo del color.
- Tamano de texto legible en tablas y formularios.
- Estados hover/focus claros.
- Formularios comprensibles con errores cerca del campo.
- Tablas escaneables y con acciones reconocibles.
- Responsive razonable: prioridad a lectura y acciones principales.
- Evitar texto truncado si impide comprender informacion critica.

## 10. Reglas para futuras mejoras UI

Reglas para Codex y futuras iteraciones:

- No hacer redisenos masivos sin aprobacion.
- Cambiar de a modulos pequenos.
- Mantener consistencia de componentes.
- No duplicar estilos.
- Preferir tokens/theme sobre clases sueltas.
- Mantener shadcn/ui como base.
- Documentar decisiones visuales relevantes.
- No introducir nuevas dependencias visuales sin necesidad clara.
- Verificar typecheck, lint y build antes de publicar.

## 11. Propuesta de implementacion gradual

### UI Fase A — Tokens y theme

- Ajustar colores base.
- Ajustar sidebar.
- Ajustar botones principales.
- Ajustar badges.

### UI Fase B — Pantallas principales

- Dashboard.
- Clientes.
- Historial de cliente.
- Busqueda global.

### UI Fase C — Modulos operativos

- Tareas.
- Interacciones.
- Reportes.
- Alertas.
- Stakeholders.
- Documentos.

### UI Fase D — Pulido

- Empty states.
- Loading states.
- Responsive.
- Print view.
- Microcopy.

## 12. Entregable

Documento principal:

- `docs/ui-ux-capitol-hub.md`

Limitaciones:

- La paleta propuesta se basa en observacion del sitio publico y el color dominante extraido del favicon (`#E0E200`).
- Antes de aplicar cambios visuales, validar contra archivos originales de marca de Capitol.
- Este documento no modifica funcionalidades, integraciones, base de datos ni reglas de negocio.

## UI Fase A aplicada

Primera fase visual aplicada de forma acotada:

- Tokens/theme base alineados con la paleta institucional: fondo `#F7F7F4`, superficies blancas, primario oscuro, borde gris calido y acento Capitol `#E0E200`.
- Sidebar con fondo oscuro, logo blanco, items compactos, hover sobrio y estado activo con acento discreto.
- Botones primarios, secundarios, outline, ghost y destructivos homogeneizados desde el componente base.
- Badges base ajustados con variantes semanticas `success`, `warning`, `danger`, `info`, `accent` y `muted`.
- Badges criticos de tareas, alertas y stakeholders migrados a variantes semanticas reutilizables.
- Cards con sombra minima y superficies mas limpias.
- Page headers con separacion inferior sutil y jerarquia contenida.

No se modificaron reglas de negocio, base de datos, integraciones ni estructura funcional de los modulos.
