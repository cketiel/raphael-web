---
version: alpha
name: "Raphael Booking Portal Design System"
description: "Provisional, from Claude Design 2a + 2c (Trips · Table and Timeline, Daylight and Harbor night). The specification rules over the mockups."
colors:
  # Daylight (light, default)
  primary: "#0B6F96"
  on-primary: "#FFFFFF"
  primary-container: "#E7F1F6"
  on-primary-container: "#0B6F96"
  primary-strong: "#0A5C7E"
  accent: "#6EC3E0"
  background: "#EEF2F5"
  surface: "#FFFFFF"
  on-surface: "#10303F"
  on-surface-variant: "#41616F"
  on-surface-muted: "#5D7380"
  surface-subtle: "#F6F8F9"
  surface-selected: "#EAF1F6"
  surface-summary: "#F1E9DB"
  outline: "#B6C7D1"
  outline-variant: "#DAE2E8"
  segmented-track: "#E4EBEF"
  error: "#B3271B"
  on-error: "#FFFFFF"
  success: "#1C8A57"
  badge: "#C0392B"
  on-badge: "#FFFFFF"
  pickup: "#C0392B"
  dropoff: "#0A5C7E"
  sidebar-top: "#0A4A66"
  sidebar-mid: "#073A52"
  sidebar-bottom: "#05293A"
  on-sidebar: "#FFFFFF"
  on-sidebar-variant: "#CFE4EF"
  sidebar-icon: "#9BDCF2"
  # Harbor night (dark)
  primary-dark: "#6EC3E0"
  on-primary-dark: "#06222E"
  primary-container-dark: "#133543"
  background-dark: "#0A1A23"
  surface-dark: "#112632"
  on-surface-dark: "#E9F1F5"
  on-surface-variant-dark: "#A8C0CC"
  surface-selected-dark: "#16303E"
  surface-summary-dark: "#1B3340"
  outline-dark: "#3A6277"
  outline-variant-dark: "#22404F"
  error-dark: "#FF9A8D"
  badge-dark: "#E0564A"
  pickup-dark: "#FF6B5E"
  dropoff-dark: "#5AB6DD"
  # Trip status (Daylight): c = mark and edge, bg = chip, ink = chip text
  status-scheduled: "#2F6FD0"
  status-scheduled-bg: "#EAF1FC"
  status-scheduled-ink: "#24579F"
  status-assigned: "#1F8A52"
  status-assigned-bg: "#E9F5EE"
  status-assigned-ink: "#176B40"
  status-accepted: "#0D8AA6"
  status-accepted-bg: "#E4F4F7"
  status-accepted-ink: "#0A6B81"
  status-waiting: "#B07A00"
  status-waiting-bg: "#FDF3DF"
  status-waiting-ink: "#8A6000"
  status-late: "#D4691A"
  status-late-bg: "#FCEFE3"
  status-late-ink: "#A85115"
  status-arrived: "#1B4F9C"
  status-arrived-bg: "#E7EDF8"
  status-arrived-ink: "#1B4F9C"
  status-inprogress: "#6D4AD6"
  status-inprogress-bg: "#EFEBFC"
  status-inprogress-ink: "#5839B8"
  status-finished: "#6B7280"
  status-finished-bg: "#F1F2F4"
  status-finished-ink: "#5A606B"
  status-canceled: "#C0392B"
  status-canceled-bg: "#FBECEB"
  status-canceled-ink: "#A8322A"
  # Trip status (Harbor night)
  status-scheduled-dark: "#7AA9F0"
  status-scheduled-bg-dark: "#15283F"
  status-scheduled-ink-dark: "#A8C8F8"
  status-assigned-dark: "#58C98D"
  status-assigned-bg-dark: "#0F2E20"
  status-assigned-ink-dark: "#8FE0B5"
  status-accepted-dark: "#45C2DD"
  status-accepted-bg-dark: "#0C2E36"
  status-accepted-ink-dark: "#8ADCEF"
  status-waiting-dark: "#D9A93C"
  status-waiting-bg-dark: "#2E2410"
  status-waiting-ink-dark: "#EDC878"
  status-late-dark: "#F0923F"
  status-late-bg-dark: "#33220F"
  status-late-ink-dark: "#F7BD81"
  status-arrived-dark: "#6E9DF0"
  status-arrived-bg-dark: "#141F36"
  status-arrived-ink-dark: "#A3C0F7"
  status-inprogress-dark: "#A98CF7"
  status-inprogress-bg-dark: "#211A3B"
  status-inprogress-ink-dark: "#C6B4FA"
  status-finished-dark: "#93A3AD"
  status-finished-bg-dark: "#1B242A"
  status-finished-ink-dark: "#B8C5CD"
  status-canceled-dark: "#F27A6C"
  status-canceled-bg-dark: "#331A18"
  status-canceled-ink-dark: "#F7A89F"
typography:
  headline-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 29px
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: -0.02em
  figure-lg:
    fontFamily: "IBM Plex Sans"
    fontSize: 31px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  title-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.3
  nav-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.3
  body-md:
    fontFamily: "IBM Plex Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
  body-strong:
    fontFamily: "IBM Plex Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.35
  body-sm:
    fontFamily: "IBM Plex Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.35
  label-button:
    fontFamily: "IBM Plex Sans"
    fontSize: 13.5px
    fontWeight: 600
    lineHeight: 1.2
  data-time:
    fontFamily: "IBM Plex Mono"
    fontSize: 15px
    fontWeight: 600
    lineHeight: 1.2
  data-md:
    fontFamily: "IBM Plex Mono"
    fontSize: 12.5px
    fontWeight: 400
    lineHeight: 1.35
  data-sm:
    fontFamily: "IBM Plex Mono"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.35
  label-caps:
    fontFamily: "IBM Plex Mono"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.12em
  status-chip:
    fontFamily: "IBM Plex Mono"
    fontSize: 11.5px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.05em
rounded:
  xs: 4px
  chip: 5px
  sm: 6px
  md: 8px
  lg: 9px
  xl: 10px
  card: 12px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 22px
  xl: 26px
  xxl: 34px
  control-height: 44px
  sidebar-width: 260px
  status-edge: 6px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    height: 44px
    padding: 0 18px
  button-primary-dark:
    backgroundColor: "{colors.primary-dark}"
    textColor: "{colors.on-primary-dark}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    height: 44px
  button-tonal:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    height: 44px
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    height: 44px
  button-danger-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.error}"
    typography: "{typography.label-button}"
    rounded: "{rounded.md}"
    height: 44px
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.lg}"
    size: 44px
  text-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    height: 44px
  view-switch:
    backgroundColor: "{colors.segmented-track}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-button}"
    rounded: "{rounded.lg}"
    height: 44px
  view-switch-selected:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
  summary-band:
    backgroundColor: "{colors.surface-summary}"
    textColor: "{colors.on-surface}"
    typography: "{typography.figure-lg}"
    padding: 18px 26px
  summary-band-dark:
    backgroundColor: "{colors.surface-summary-dark}"
    textColor: "{colors.on-surface-dark}"
    typography: "{typography.figure-lg}"
  sidebar:
    backgroundColor: "{colors.sidebar-mid}"
    textColor: "{colors.on-sidebar}"
    typography: "{typography.nav-md}"
    width: 260px
  nav-item-active:
    backgroundColor: "{colors.sidebar-top}"
    textColor: "{colors.on-sidebar}"
    rounded: "{rounded.lg}"
    height: 48px
  count-badge:
    backgroundColor: "{colors.badge}"
    textColor: "{colors.on-badge}"
    rounded: "{rounded.full}"
  status-chip-scheduled:
    backgroundColor: "{colors.status-scheduled-bg}"
    textColor: "{colors.status-scheduled-ink}"
    typography: "{typography.status-chip}"
    rounded: "{rounded.chip}"
    height: 26px
  status-chip-late:
    backgroundColor: "{colors.status-late-bg}"
    textColor: "{colors.status-late-ink}"
    typography: "{typography.status-chip}"
    rounded: "{rounded.chip}"
    height: 26px
  status-chip-canceled:
    backgroundColor: "{colors.status-canceled-bg}"
    textColor: "{colors.status-canceled-ink}"
    typography: "{typography.status-chip}"
    rounded: "{rounded.chip}"
    height: 26px
  trip-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-strong}"
    padding: 0 26px
  trip-row-selected:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.on-surface}"
  table-header:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-caps}"
    height: 38px
  timeline-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
  timeline-card-past:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
  in-progress-panel:
    backgroundColor: "{colors.sidebar-bottom}"
    textColor: "{colors.on-sidebar}"
    typography: "{typography.data-time}"
    rounded: "{rounded.card}"
---

# Raphael Booking Portal: sistema de diseño

> **Provisional (etapa 5).** Deducido del export de Claude Design, variantes **2a + 2c** ([notes](proposals/claude-design/2026-10-09-r1/notes.md), [evaluación](proposals/README.md)). Se cierra en la etapa 6 con el resultado de la Ronda 2. El comportamiento irá en `EXPERIENCE.md`. **Si una maqueta y esta especificación no coinciden, manda la especificación.**

## Overview
Portal donde coordinadoras de transporte de centros de diálisis y hospitales reservan y siguen los viajes de sus pacientes. Lo revisan decenas de veces al día, en PC y en la tableta del mostrador: **calma clínica, precisión de panel de control y una calidez discreta**. Nada de aire de emergencia ni de app de ride-hailing.

**La idea central: la misma lista de viajes desde dos perspectivas.** **Table** responde «¿qué hay?» —densa, ordenada, para revisar y actuar en lote—. **Timeline** responde «¿cómo va el día?» —el tiempo como eje, la marca de *ahora*, el viaje en curso y lo que necesita atención—. No son dos pantallas: es una pantalla con un conmutador, el mismo filtro, la misma selección y las mismas acciones.

Dos modos: **Daylight** (claro, por defecto) y **Harbor night** (oscuro).

## Colors
- **Marca:** el azul océano del logo. `primary` (#0B6F96) para la acción principal y el foco; `primary-strong` y el degradado del menú (`sidebar-top` → `sidebar-bottom`) dan el ancla oscura; `accent` (#6EC3E0) es luz: la barra del elemento activo del menú, los brillos y, en oscuro, el primario.
- **Superficies:** fondo `background`, contenido en `surface` blanco, y la **banda de resumen** en arena (`surface-summary`, #F1E9DB): la nota cálida del sistema, solo ahí.
- **Ruta:** recogida en rojo (`pickup`) y destino en azul (`dropoff`), siempre como **pin**. Canceled también es rojo, pero como etiqueta: la forma los distingue.
- **Estados del viaje:** nueve, con el significado del brief §5.3. Cada uno tiene tres valores: la marca (`status-*`, que se usa en el **borde izquierdo de 6 px** de la fila o tarjeta y en el cuadradito de la etiqueta), el fondo de la etiqueta (`-bg`) y el texto de la etiqueta (`-ink`). Las parejas `-bg` / `-ink` cumplen AA.
- **Error y avisos:** `error` para acciones destructivas («Cancel selected», la ✕ de cada fila); `badge` para contadores.
- **Harbor night:** cada token con el sufijo `-dark`. El primario pasa a `accent` con texto oscuro (`on-primary-dark`), las superficies a azules muy profundos y los estados a versiones más claras sobre fondos tintados.

## Typography
- **IBM Plex Sans** para la interfaz y **IBM Plex Mono** para los datos operativos: horas, IDs, millas, etiquetas de columna, cifras secundarias y etiquetas de estado. El mono hace que las horas y los IDs se alineen y se escaneen como en un tablero de salidas.
- Etiquetas en versalitas mono (`label-caps`, 11 px, espaciado .12em) para columnas y rótulos del resumen.
- Cifras del resumen en `figure-lg`; la cifra de cancelados va en `error`.
- **Formato de hora: 24 h** (`HH:mm`), como el portal actual. Decidido por el usuario el 2026-10-09.
- Se alojan con `next/font` (la CSP no admite Google Fonts en caliente).

## Layout
- **PC (≥1280):** menú lateral fijo de 260 px; barra superior con fecha y hora en mono, el conmutador Timeline | Table, idioma, campana y usuario; cabecera con título, «Export Report» y «New Booking»; fila de filtros; banda de resumen; lista. Márgenes de 26 px.
- **Table:** rejilla de 7 columnas `44px 104px 1.15fr 2.53fr 124px 128px 152px` (selección, hora + cita, paciente, ruta, estado, Provider, acciones). Filas de altura natural, sin cortar texto.
- **Timeline:** eje vertical a la izquierda con la hora, tarjetas a la derecha y, en PC, un **panel derecho** con el viaje en curso y «Needs attention». La marca **NOW hh:mm** separa lo pasado de lo que viene.
- **Tableta 1024:** menú compacto de iconos. **Tableta 768:** barra superior con pestañas de secciones; la tabla pasa a tarjetas de una columna con el borde de estado.
- **Teléfono (390):** barra superior con marca, campana y avatar; conmutador bajo el título; resumen en 2 × 2; navegación inferior (Trips, Catalog, Alerts, Admin); «New Booking» como botón redondo; el viaje en curso, en una **hoja inferior** fija.
- Escala de espaciado: 4 · 8 · 12 · 16 · 22 · 26 · 34. Controles de 44 px de alto (táctiles en tableta).

## Elevation & Depth
Plano y tonal: la jerarquía viene de los tonos y de líneas de 1 px (`outline-variant`), no de sombras. Sombra solo en lo que flota (menús abiertos, modales, la hoja inferior del teléfono). El elemento activo del menú brilla: fondo translúcido, anillo interior y una barra `accent` con resplandor.

## Shapes
Radios suaves y pequeños: 8 px controles, 9 px botones de icono y tarjetas del timeline, 5 px etiquetas de estado, 12 px paneles destacados, círculo para avatares y contadores. El borde de estado de 6 px es recto por dentro.

## Components
- **`view-switch`** · el conmutador **Timeline | Table**: control segmentado de 44 px; el seleccionado en `surface`. Mantiene filtro, búsqueda, selección y desplazamiento al cambiar. Es un componente protagonista.
- **`trip-row`** (Table): borde de estado a la izquierda; hora en `data-time` con la cita debajo (`APPT hh:mm`); paciente en `body-strong` con `#ID · espacio · millas` en `data-sm`; ruta en dos líneas con pin; etiqueta de estado; Provider en dos líneas como máximo; tres acciones `icon-button` (seguir, editar, cancelar). Seleccionada: `surface-selected`.
- **`timeline-card`** (Timeline): mismo contenido que la fila, en tarjeta, colgada de su hora en el eje. Las pasadas (Finished, Canceled) en `timeline-card-past`. Acciones: seguir y «⋯».
- **`timeline-now-marker`**: línea con la etiqueta **NOW hh:mm** en mono y `error`/rojo suave, entre el último viaje pasado y el siguiente.
- **`in-progress-panel`**: tarjeta oscura con el viaje en curso (paciente, recogida y destino, hora de llegada estimada grande en `data-time`, «Track»). En teléfono, hoja inferior.
- **`needs-attention`**: lista breve bajo el panel, con el color de estado (Late, Arrived…).
- **`status-chip`**: cuadradito de color + texto en mayúsculas mono, fondo tintado y anillo de 1 px. Nueve variantes.
- **`summary-band`**: cuatro cifras con rótulo en `label-caps` y, a la derecha, «N SELECTED» y `button-danger-outline` «Cancel selected».
- **Botones:** `button-primary` (Search), `button-tonal` (New Booking), `button-outline` (Export Report), `button-danger-outline` (Cancel selected), `icon-button` (acciones de fila).
- **`sidebar`** y **`nav-item-active`**; `count-badge` para Notifications; abajo, «Live updates · connected» con punto verde que late, y la tarjeta del usuario.
- **Iconos:** Phosphor (regular; *fill* para el activo). El portal actual usa Bootstrap Icons: se decide al implementar.

## Do's and Don'ts
- Do mostrar el estado dos veces: borde de color **y** etiqueta con texto. Nunca solo color.
- Do usar IBM Plex Mono para todo lo que se compara o se busca con la vista (horas, IDs, millas).
- Do mantener Table y Timeline como **una** pantalla: mismo filtro, misma selección, mismas acciones.
- Don't usar el rojo de recogida en otra cosa que pines; Canceled va siempre como etiqueta.
- Don't poner sombras en filas o tarjetas: la profundidad es tonal.
- Don't inventar datos en las maquetas: solo los CSV del escenario.
- Don't decidir el color del nombre «RAPHAEL» desde aquí: sigue abierto.
