# Prompts para Claude Design: «Raphael Booking Portal»

| | |
|---|---|
| **Versión** | 1.2 |
| **Fecha** | 2026-10-09 |
| **Herramienta** | [claude.ai/design](https://claude.ai/design): planes de pago de Claude; consume su límite de uso |
| **Basado en** | [creative-brief.md](creative-brief.md) v1.0 |

## Preparación
1. Crea un proyecto en Claude Design: «Raphael Booking · exploración 1».
2. **Adjunta:**
   - `creative-brief.md`;
   - los seis CSV de `data/` y su `README.md`;
   - las 4 imágenes elegidas de la dirección de arte (`design/proposals/art-direction/2026-10-08/`) y su `notes.md`;
   - el logo `apps/booking/public/brand/raphael-mark.png`.

---

## Ronda 1 · Etapa 3 · Tres direcciones de la página de Viajes
```text
Eres el diseñador principal del «Raphael Booking Portal», la web donde centros de diálisis, clínicas y hospitales reservan transporte médico no urgente para sus pacientes y lo siguen en vivo. Te adjunto el brief creativo, seis archivos CSV con los datos del escenario, imágenes de dirección de arte y el logo. Léelos completos antes de empezar.

Primera ronda, exploración. Quiero ver 3 direcciones visuales claramente distintas entre sí para UNA sola pantalla: «Viajes» (Trips), la página principal, en PC (1440 px), con los 10 viajes del 20/10/2026 de la sección 8 del brief y el menú lateral completo. La interfaz va en inglés. Toma las imágenes adjuntas como punto de partida del lenguaje visual, no como algo que copiar. El color del nombre «Raphael» no está decidido: aunque en alguna imagen aparezca en rojo, no lo pongas rojo.

El menú lateral es la seña de identidad del producto: en cada dirección tiene que ser vistoso y profesional a la vez.

Para cada dirección dame:
- un nombre y la idea en dos frases;
- la paleta (partiendo del azul océano del logo), las tipografías y cómo resuelves el menú lateral, las cuatro cifras del resumen, las etiquetas de estado y la ruta roja → azul;
- por qué encaja con una coordinadora de transporte que revisa decenas de viajes al día.

Muéstralas una al lado de la otra en el lienzo. Arriesga: al menos una dirección tiene que sorprenderme. Respeta lo obligatorio del brief (sección 9); todo lo demás es libre. No diseñes todavía las demás pantallas ni los otros tamaños.
```

## Ajustes · Etapa 4 · Solo la página de Viajes
Usa **comentarios sobre el lienzo** para los detalles. Algunos prompts útiles:
```text
Combina la dirección «{A}» con el menú lateral de «{B}». Solo la página de Viajes.
```
```text
Enséñame 2 variaciones de «{dirección}» cambiando solo las etiquetas de estado.
```
```text
Revisa el contraste de todos los textos (mínimo WCAG AA), que los elementos táctiles midan al menos 44 px y que los textos admitan el español, un 25 % más largo. Genera también el modo oscuro de esta pantalla.
```
```text
Muéstrame la misma dirección en tableta (1024 px horizontal y 768 px vertical) y en teléfono (390 × 844), solo la página de Viajes. Propón cómo se resuelve el menú en cada tamaño.
```

## Ronda 2 · Etapa 5 · Las pantallas clave (con la variante elegida)
**Variante elegida (2026-10-09):** 2a + 2c — una dirección con **dos vistas de la lista, Table y Timeline**, en Daylight y Harbor night. Ver [notes](../proposals/claude-design/2026-10-09-r1/notes.md).

**Antes de pegar el prompt:**
1. Trabaja **en el mismo proyecto** de la Ronda 1: conserva el contexto, los adjuntos y la variante.
2. **Adjunta** [`design/DESIGN.md`](../DESIGN.md) (el provisional). Si el proyecto ya tiene el brief y los CSV, no hace falta volver a subirlos.
3. **No adjuntes** el sistema de diseño «Nocturne» de la cuenta ni lo elijas si te lo ofrece: no es el de esta dirección.
4. Pega el prompt **entero, en un solo mensaje**. Los detalles después, con **comentarios sobre el lienzo**, no por chat.

```text
Segunda ronda. Me quedo con 2a + 2c: una sola dirección con dos vistas de la misma lista de viajes, Table y Timeline, en Daylight y en Harbor night. Es la idea central del producto: no son dos pantallas, es una pantalla con un conmutador, con el mismo filtro, la misma búsqueda, la misma selección y las mismas acciones. Quiero que todo lo que diseñes ahora la respete y la refuerce.

Te adjunto DESIGN.md: es el sistema de diseño obligatorio (colores, tipografía, radios, espaciado y componentes, en los dos modos). Sale de 2a y 2c; si para una pantalla nueva necesitas algo que no está, propónlo y dime qué token añadirías. No cambies la página Trips salvo para que sea coherente con lo nuevo.

Construye, en este orden:

1. Una página de sistema de diseño con los componentes, en Daylight y Harbor night: el conmutador Timeline | Table, la fila de la tabla, la tarjeta del timeline (normal, pasada, seleccionada), la marca NOW, el panel del viaje en curso, "Needs attention", las 9 etiquetas de estado, botones (primary, tonal, outline, danger outline, icon), campos (texto, fecha, hora, selector, buscador de direcciones), interruptor, pestañas, banda de resumen, menú lateral, menú compacto de tableta, navegación inferior del teléfono, modales, diálogo de confirmación, avisos y los estados vacío, cargando y error de la lista en las dos vistas.

2. Un prototipo interactivo en PC (1440 px) con estas pantallas, navegable desde el menú lateral, donde funcionen de verdad:
   a. Trips: el conmutador Timeline | Table conservando filtro, búsqueda y selección; seleccionar viajes y "Cancel selected" con su diálogo ("Cancel 2 trips?"); el menú de idioma y el menú de usuario abiertos.
   b. New Booking / edición: modal de tres pasos (paciente con buscador, logística, ruta) con el mapa de Google al lado, las sugerencias de dirección abiertas con "Powered by Google" y el interruptor "Create Return Trip?" con la hora de vuelta.
   c. Seguimiento del viaje en curso (#40233): estado, recogida y destino con hora pedida, estimada y de llegada, y el mapa con el vehículo. Debe abrirse desde "Track" en la fila (Table), en la tarjeta (Timeline) y en el panel del viaje en curso.
   d. Notifications: pestañas con contadores, leídos y no leídos, "Mark all as read" y "View trip", que vuelve a Trips y resalta el viaje en la vista que esté activa: la fila en Table, la tarjeta en Timeline, con desplazamiento hasta él.
   e. Catalog de Providers: buscador, grupos, condado, ciudad, "Contracted / Not contracted", "Contract" y "Remove" en cada fila, y la ficha de un Provider.
   f. Admin › Billing: funding source y requisitos del viaje, los Billing Items propios y las tarifas, con las de la oficina en solo lectura.

3. En teléfono (390 × 844): Trips en Timeline y en Table, el formulario de viaje y el seguimiento. En tableta (1024 y 768): Trips en las dos vistas y Notifications.

4. Harbor night para Trips (las dos vistas), el seguimiento y Notifications.

Reglas: usa exclusivamente los datos de los adjuntos (escenario del 20/10/2026, 9:40, sesión de Ana López); horas en 24 h; la interfaz en inglés; la recogida siempre es un pin rojo y el destino un pin azul, y Canceled siempre una etiqueta; el estado se muestra con borde de color y con etiqueta de texto, nunca solo con color; el color del nombre "RAPHAEL" no está decidido: no lo pongas rojo. No diseñes Login, Admin › Users ni Admin › Organization: se construirán desde las especificaciones.

Al terminar, explícame las decisiones que tomaste, las alternativas que descartaste y los tokens que añadirías a DESIGN.md.
```

### Cómo guardar la Ronda 2
En `design/proposals/claude-design/AAAA-MM-DD-r2/`:
- **Una captura por pantalla y tamaño**, con nombre que diga qué es: `r2-trips-table-pc.png`, `r2-trips-timeline-pc.png`, `r2-booking-pc.png`, `r2-tracking-pc.png`, `r2-notifications-pc.png`, `r2-catalog-pc.png`, `r2-billing-pc.png`, `r2-system-daylight.png`, `r2-system-night.png`, y los de teléfono y tableta con `-phone`, `-tablet-1024`, `-tablet-768`; los oscuros con `-night`.
- **El export en ZIP** (`export-r2.zip`).
- **La explicación final** de Claude Design, copiada tal cual en `explicacion.txt`.
- Si algo no te gustó, una línea por cosa en `pendiente.txt`: lo pido en los ajustes.

## Cierre · Etapa 6
- Exporta (HTML, PDF o ZIP) y pide el **paquete de entrega para Claude Code**.
- Guárdalo en `design/proposals/claude-design/AAAA-MM-DD/`, y lo definitivo, en `design/reference/`.

## Historial
| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-10-08 | Primera versión |
| 1.1 | 2026-10-08 | Ronda 1: el color del nombre «Raphael» no está decidido; imágenes de `art-direction/2026-10-08/` |
| 1.2 | 2026-10-09 | Ronda 2 rehecha: variante 2a + 2c (Table y Timeline como concepto central), DESIGN.md provisional obligatorio, 6 pantallas clave en lugar de las 16, cómo guardar el resultado |
