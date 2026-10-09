# Propuestas de diseño y evaluación

## Dónde está cada cosa
| Carpeta | Contenido |
|---|---|
| [art-direction/2026-10-08/](art-direction/2026-10-08/) | Las 4 imágenes de Gemini que se adjuntaron + `notes.md`. La segunda opción del usuario, en `art-direction/mi eleccion/` |
| [claude-design/2026-10-09-r1/](claude-design/2026-10-09-r1/) | Ronda 1 y ajustes: capturas de la variante elegida en PC, tableta y teléfono, claro y oscuro, el export HTML y `notes.md` |
| [stitch/](stitch/) | Las tres variantes S2 del menú lateral (`S2-1..3.png`) |

`notes.md` recoge en cada carpeta el prompt usado y su versión, lo que gustó, lo que no y la decisión.

## Etapa 4 · Página principal (Trips, PC)
Rúbrica de la skill `ui-design`, sin cambios de pesos. Puntuación de 1 a 5.

| Criterio | Peso | Claude Design · 2a + 2c (Table + Timeline) | Stitch · S2-1 | Notas |
|---|---|---|---|---|
| 1 · Atractivo y personalidad | 30 % | 5 | 3 | Claude Design tiene identidad propia: degradado del menú, banda de arena y Plex Mono para los datos. Stitch es correcto pero de plantilla |
| 2 · Legibilidad de lo esencial | 25 % | 5 | 3 | Hora, paciente, ruta y estado en una fila, con el estado también en el borde. Stitch parte las direcciones en 3-4 líneas y en S2-3 se rompe la maqueta |
| 3 · Identidad y tono | 20 % | 5 | 3 | Calma clínica, sin aire de emergencia. Stitch **inventa** datos («patient no-show», «90% authorized», «Logistics Lead», «Page 1 of 2») |
| 4 · Controles transversales | 10 % | 5 | 4 | Conmutador Timeline / Table, idioma, campana, selección y «Cancel selected» claros |
| 5 · Viabilidad y ligereza | 10 % | 4 | 4 | Todo es CSS y SVG. Dos fuentes de Google (se alojan con `next/font`) y Phosphor en lugar de Bootstrap Icons |
| 6 · Accesibilidad | 5 % | 4 | 3 | Pasó por una ronda de accesibilidad y tiene modo oscuro. Los textos de 11 px en Plex Mono hay que vigilarlos |
| **Total ponderado** | 100 % | **4,85** | **3,25** | |

**Qué me llevo de cada una:** de Stitch, nada que no esté ya en Claude Design; confirma que el menú lateral oscuro con barra de acento (su S2-1, la G2 estilo 1) era la dirección buena.

**Variante elegida (2026-10-09, el usuario):** **Claude Design, 2a + 2c: una sola dirección con dos vistas de la lista, Table y Timeline**, con modo claro (*Daylight*) y oscuro (*Harbor night*). Las dos vistas son un concepto central del producto y el diseño completo las tiene que tratar como tal. Registrada en `_meta/WEB_STACK.md` §6.2.

**Herramienta para el diseño completo (etapa 5):** Claude Design, en el mismo proyecto, con el [DESIGN.md provisional](../DESIGN.md) adjunto.

## Etapa 5 · Diseño completo
Pendiente de la Ronda 2. Se evalúa con la tabla de la etapa 5 de la rúbrica; la «pieza protagonista» es el par **Table / Timeline**.
