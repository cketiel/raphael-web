# Diseño de las webs de Raphael

Aquí vive el diseño del **Booking Portal**. Se hace con el método por etapas de la skill `ui-design`:
primero la dirección de arte, después **una sola** pantalla en varias direcciones, se elige **una**, y solo
entonces se diseña todo el portal con esa dirección. El mismo lenguaje servirá luego para la página de ETA
y el portal corporativo.

> **Las especificaciones mandan sobre las maquetas.** Cuando exista, `DESIGN.md` (cómo se ve) y
> `EXPERIENCE.md` (cómo se comporta) deciden. Las imágenes y los prototipos solo ilustran.

## Estado
```text
Diseño del Booking Portal:
- [x] 0. Preparar: pantallas, escenario y datos (data/), carpetas
- [x] 1. Brief creativo común (prompts/creative-brief.md)
- [ ] 2. Dirección de arte con Gemini (prompts/gemini-art-direction.md)
- [ ] 3. Página de Viajes: direcciones en Claude Design y Stitch (web y móvil)
- [ ] 4. Iterar la página de Viajes y elegir UNA variante
- [ ] 5. Diseño completo: todo el portal, en PC, tableta y teléfono
- [ ] 6. Consolidar: DESIGN.md + EXPERIENCE.md + prototipo de referencia
- [ ] 7. Implementar en apps/booking y retrospectiva
```

## Dónde está cada cosa
| Ruta | Qué |
|---|---|
| [`prompts/creative-brief.md`](prompts/creative-brief.md) | La fuente común: producto, público, personalidad, dominio, pantallas, obligatorio y libre |
| [`prompts/data/`](prompts/data/README.md) | El escenario del 20/10/2026, con datos **ficticios** (el repo es público) |
| [`prompts/gemini-art-direction.md`](prompts/gemini-art-direction.md) | Etapa 2: moodboard, menú lateral en 3 estilos, ilustración, la pieza protagonista |
| [`prompts/stitch-web.md`](prompts/stitch-web.md) | Stitch, proyecto **web**: PC (1440) y tableta (1024 y 768) |
| [`prompts/stitch-mobile.md`](prompts/stitch-mobile.md) | Stitch, proyecto **móvil**: teléfono (390 × 844) |
| [`prompts/claude-design.md`](prompts/claude-design.md) | Claude Design: 3 direcciones y luego el prototipo completo |
| `proposals/art-direction/` · `proposals/stitch/` · `proposals/claude-design/` | Lo que devuelve cada herramienta, por fecha, con su `notes.md` |
| `reference/` | El prototipo de referencia final |

## Orden de trabajo
1. **Gemini (G1–G4, G5 opcional).** Elige 2–4 imágenes y guárdalas en `proposals/art-direction/AAAA-MM-DD/`.
2. **Página de Viajes**, con esas imágenes adjuntas:
   - Claude Design, ronda 1 (3 direcciones);
   - Stitch web, S1 y S2 (y S3 para la tableta);
   - Stitch móvil, S1 y S2.
3. **Elegir una** variante (o una mezcla explícita) con la rúbrica de la skill. La decisión se anota aquí.
4. **DESIGN.md** de la variante elegida, importado en los dos proyectos de Stitch y adjunto en Claude Design:
   - todo el portal (W1–W14 en web, M1–M12 en móvil, ronda 2 en Claude Design).
5. **Consolidar** DESIGN.md + EXPERIENCE.md y pasar a implementar.

## Lo que ya existe
El portal tiene un rediseño provisional (`apps/booking`, commit `e274c11`):
- un kit de componentes en `src/components/ui/`;
- los tokens en `src/app/globals.css`, que salen del logo;
- Bootstrap Icons, cargados desde un solo módulo.

Cuando el DESIGN.md esté cerrado, sustituye esos tokens y ajusta el kit: las pantallas leen los tokens, no colores sueltos.
