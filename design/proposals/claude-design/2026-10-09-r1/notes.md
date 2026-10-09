# Claude Design · Ronda 1 y ajustes (etapas 3 y 4) — 2026-10-09

| | |
|---|---|
| **Proyecto** | [Trips Directions](https://claude.ai/design/p/b045f6c7-ff85-413d-a87f-796d85978857?file=Trips+Directions.dc.html) (privado, cuenta del usuario) |
| **Prompt** | [claude-design.md](../../../prompts/claude-design.md) v1.1, ronda 1 y ajustes de la etapa 4 |
| **Adjuntos** | `creative-brief.md`, los CSV de `data/`, las 4 imágenes de [art-direction/2026-10-08](../../art-direction/2026-10-08/) y el logo |
| **Exportación** | [export-r1.zip](export-r1.zip): el lienzo completo en HTML (`Trips Directions.dc.html`), con todas las direcciones, sin la carpeta `_ds/` |

## Lo que se eligió
**Una dirección con dos vistas de la misma lista, conmutables: Table y Timeline.** El usuario eligió dos variantes y no una, a propósito: le gusta ver los viajes del día desde **dos perspectivas** y quiere que el diseño lo trate como un concepto central, no como una opción secundaria.

| Variante | Origen | Qué es | Capturas |
|---|---|---|---|
| **2a** · Trips · Table — Daylight | 1d revisada | Tabla densa: hora y cita, paciente con ID, espacio y millas, ruta roja → azul, estado, Provider y acciones | [PC](2a-Trips-Table-Daylight(1d%20revisada).png) |
| **2b** · Trips · Table — Harbor night | 1d en modo oscuro | La misma, en oscuro | [PC](2b-Trips-Table-Harbor%20night(1d%20en%20modo%20oscuro).png) |
| **2c** · Trips · Timeline — Daylight | 1e revisada | Línea de tiempo vertical con la marca **NOW 09:40**, tarjetas por viaje y un panel derecho con el viaje **en curso** y **Needs attention** | [PC](2c-Trips-Timeline-Daylight(1e%20revisada).png) |
| **2d** · Trips · Timeline — Harbor night | 1e en modo oscuro | La misma, en oscuro | [PC](2c-Trips-Timeline-Harbor%20night(1e%20en%20modo%20oscuro).png) |

Tableta (1024 y 768) y teléfono (390), en las dos vistas: `r1-final-*`.

## Lo que funciona y hay que conservar
- **El conmutador Timeline | Table** en la barra superior (PC) o bajo el título (teléfono y tableta vertical): la misma lista, el mismo filtro y la misma selección.
- **El marco:** menú lateral de 260 px con degradado `#0a4a66` → `#05293a` y la marca arriba, «Live updates · connected» y el usuario abajo. En tableta vertical pasa a barra superior con pestañas; en teléfono, a navegación inferior.
- **La banda de resumen** en arena (`#f1e9db`) con las cuatro cifras y, a la derecha, la selección y «Cancel selected».
- **IBM Plex Mono para los datos operativos** (horas, IDs, etiquetas de columna, estados), IBM Plex Sans para el resto.
- **El color del estado repetido en el borde izquierdo de cada fila o tarjeta**, además de la etiqueta. Se lee de un vistazo, también en tableta.
- **La ruta como dos líneas con pin:** rojo (recogida) y azul (destino), con lugar en negrita y dirección después. La forma distingue la recogida (pin) de Canceled (etiqueta).
- **Timeline:** la marca de «ahora», el panel del viaje en curso con su ETA y «Track», y «Needs attention» (Late, Arrived). En teléfono el viaje en curso baja a una **hoja inferior** fija.
- **Modo oscuro completo** (Harbor night) desde la primera ronda.

## Lo que hay que vigilar en la Ronda 2
- **Formato de hora: 24 h** (decidido por el usuario el 2026-10-09), como el portal actual. El export trae un ajuste 12h/24h con 12 h por defecto: no se usa.
- **Iconos:** Claude Design usa **Phosphor**; el portal actual, Bootstrap Icons. Se decide al implementar; el DESIGN.md provisional sigue a Phosphor.
- **El sistema de diseño «Nocturne»** venía en el export (`_ds/`): es el de la cuenta, no el de esta dirección, y el HTML no lo usa. Se quitó del ZIP antes de subirlo (repo público) y no se adjunta en la Ronda 2.
- **El color del nombre «RAPHAEL»** sigue sin decidir: aquí va en blanco sobre el degradado, que es correcto, pero no cierra la decisión.
- No hay capturas de las tres direcciones originales (1a-1e) por separado: están dentro del export.
