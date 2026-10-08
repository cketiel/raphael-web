# Prompts para Claude Design: «Raphael Booking Portal»

| | |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 2026-10-08 |
| **Herramienta** | [claude.ai/design](https://claude.ai/design): planes de pago de Claude; consume su límite de uso |
| **Basado en** | [creative-brief.md](creative-brief.md) v1.0 |

## Preparación
1. Crea un proyecto en Claude Design: «Raphael Booking · exploración 1».
2. **Adjunta:**
   - `creative-brief.md`;
   - los seis CSV de `data/` y su `README.md`;
   - las 2–4 imágenes elegidas de la dirección de arte (`design/proposals/art-direction/…`);
   - el logo `apps/booking/public/brand/raphael-mark.png`.

---

## Ronda 1 · Etapa 3 · Tres direcciones de la página de Viajes
```text
Eres el diseñador principal del «Raphael Booking Portal», la web donde centros de diálisis, clínicas y hospitales reservan transporte médico no urgente para sus pacientes y lo siguen en vivo. Te adjunto el brief creativo, seis archivos CSV con los datos del escenario, imágenes de dirección de arte y el logo. Léelos completos antes de empezar.

Primera ronda, exploración. Quiero ver 3 direcciones visuales claramente distintas entre sí para UNA sola pantalla: «Viajes» (Trips), la página principal, en PC (1440 px), con los 10 viajes del 20/10/2026 de la sección 8 del brief y el menú lateral completo. La interfaz va en inglés. Toma las imágenes adjuntas como punto de partida del lenguaje visual, no como algo que copiar.

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

## Ronda 2 · Etapa 5 · Todo el portal (solo con la variante elegida)
Adjunta además el **DESIGN.md provisional**.
```text
Me quedo con «{variante elegida}»[, con estos cambios: …]. Te adjunto el DESIGN.md provisional: úsalo como sistema de diseño obligatorio (tokens de color, tipografía, radios y espaciado).

Segunda ronda, construye:
1. Un sistema de diseño con todos los componentes: menú lateral, menú compacto de tableta, navegación inferior del teléfono, barra superior, menú de idioma, menú de usuario, botones, campos (texto, fecha, hora, selector, buscador de direcciones con sugerencias), interruptor, pestañas, tarjetas de resumen, etiquetas de estado, filas y tarjetas de viaje, modales, diálogos de confirmación, avisos y estados vacío, cargando y error.
2. Un prototipo interactivo en PC (1440 px) con TODAS las pantallas de la sección 6 del brief, navegable desde el menú lateral, donde funcionen de verdad: el menú de idioma y el de usuario, el modal de alta de viaje con sus tres pasos y el interruptor de viaje de vuelta, las sugerencias de dirección, las pestañas de Notificaciones y de Admin, «View trip» que lleva a Viajes y resalta el viaje, y «Show» de la API key.
3. Las mismas pantallas en tableta (1024 y 768 px) y en teléfono (390 × 844), con su navegación propia.

Usa exclusivamente los datos de los adjuntos. Al final explícame las decisiones que tomaste y qué alternativas descartaste.
```

## Cierre · Etapa 6
- Exporta (HTML, PDF o ZIP) y pide el **paquete de entrega para Claude Code**.
- Guárdalo en `design/proposals/claude-design/AAAA-MM-DD/`, y lo definitivo, en `design/reference/`.

## Historial
| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-10-08 | Primera versión |
