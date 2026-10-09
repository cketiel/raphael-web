# Prompts para Google Stitch · proyecto MÓVIL (teléfono): «Raphael Booking Portal»

| | |
|---|---|
| **Versión** | 1.1 |
| **Fecha** | 2026-10-08 |
| **Herramienta** | [stitch.withgoogle.com](https://stitch.withgoogle.com) (gratuito, con límite mensual) |
| **Basado en** | [creative-brief.md](creative-brief.md) v1.0 |
| **Proyecto hermano** | [stitch-web.md](stitch-web.md) (PC y tableta) |

## Cómo trabajar
1. Proyecto nuevo de tipo **App** (móvil): «Raphael Booking · Mobile». Es la misma web en un teléfono (390 × 844), no una app nativa: navegación inferior, tarjetas y diálogos a pantalla completa.
2. **Cuando el proyecto web ya tenga dirección elegida**, importa aquí su DESIGN.md antes de S1 (**Modify → Design System → DESIGN.md**). Así los dos proyectos comparten el sistema y el móvil solo decide su composición. Si se exploran a la vez, adjunta las mismas imágenes de dirección de arte.
3. **Una pantalla por prompt y un cambio por retoque.** Captura tras cada acierto.
4. Los prompts van en inglés y los textos de la interfaz entre comillas, en inglés.
5. Longitud: `python scripts/measure_prompts.py design/prompts/stitch-mobile.md` (objetivo, menos de 1.800).

---

## S1 · Etapa 3 · Contexto + página de Viajes (teléfono)
> 🇪🇸 El contexto y la página principal en un teléfono, con 5 viajes del escenario.

```text
Mobile web app screen, portrait 390x844, for "Raphael Booking Portal", where dialysis centers book non-emergency medical transport for patients and follow each trip live. Vibe: calm, trustworthy, precise, quietly warm healthcare logistics. Brand: the attached pin logo, ocean blue #005070 to #50a0c0. The color of the "Raphael" wordmark is undecided: do not make it red. Not a ride-hailing app, not an emergency app. All UI text in English.

Screen "Trips":
- Top bar: logo + "Raphael" / "Booking Portal", right "EN", bell with "3", avatar "AL".
- Title "Trips", primary button "New Booking", secondary "Export Report".
- Collapsible filter card: "Start Date" 10/20/2026, "End Date" 10/20/2026, "Search", "Today", "Tomorrow", search field "Find a trip".
- Summary cards 2x2 with icons: "Total trips 10", "Billable trips 9", "Canceled trips 1", "Total billed value $612.40".
- "Select all" and "10 of 10 trips".
- Trip cards: checkbox, time + "#id", status label on the right, patient + space type, red pin pickup line, blue pin destination line, provider, icons track/edit/cancel:
08:45 #40233 Luis Fernández WCH, 455 NW 42nd Ave → Sunrise Dialysis Center, In progress (violet), Raphael (default)
09:20 #40234 Dorothy Williams STR, Palm Gardens Rehab → Jackson Memorial Hospital, Arrived (blue), Bayside Medical Rides
11:00 #40236 James O'Neil WCH, 7600 Biscayne Blvd → Mount Sinai Medical Center, Assigned (green), Coastal Care Transit
14:00 #40239 Rosa Delgado WCH, Sunrise Dialysis Center → 3401 SW 22nd St, Late (orange)
15:30 #40240 Peter Novak AMB, 15400 SW 104th St → Sunrise Dialysis Center, Canceled (red)
- Bottom navigation with icons: "Trips" (active), "Catalog", "Notifications" (badge "3"), "Admin".
```

## S2 · Etapa 3 · Variantes de un solo cambio (la tarjeta de viaje)
```text
On the "Trips" screen, change only the trip cards: a colored left edge in the status color and the pickup time large on the left as a time column. Keep everything else exactly as it is.
```
```text
On the "Trips" screen, change only the trip cards: the route drawn as a small vertical line between a red pickup dot and a blue destination dot, like a mini journey. Keep everything else exactly as it is.
```
```text
On the "Trips" screen, change only the bottom navigation: a floating rounded bar with a raised center button "New Booking". Keep everything else exactly as it is.
```

## Retoques · Etapa 4 · Un cambio por prompt
```text
On the "Trips" screen, {un único cambio}. Change nothing else.
```

---

## Etapa 5 · Todo el portal en el teléfono (con el DESIGN.md importado)
Una pantalla por prompt. Los datos son los mismos que en el proyecto web ([stitch-web.md](stitch-web.md), W1–W14).

### M1 · Menús abiertos
```text
Mobile web screen 390x844: the "Trips" screen with the language menu open as a small dropdown under "EN": header "LANGUAGE", "English · EN" (selected, check), "Español · ES". Second state on the canvas: the user menu as a bottom sheet: "Signed in as" / "Ana López", "Change password" (key icon), "Logout" (red). Same design system.
```

### M2 · Login
```text
Mobile web screen 390x844: "Login". Same design system. Logo "Raphael" at the top, "Raphael Booking Portal", "Sign in with your facility account.", fields "User" (person icon) and "Password" (key icon, show/hide eye), full-width primary button "LOGIN" with a sign-in icon. Calm background, no photos.
```

### M3 · Formulario de viaje
```text
Mobile web screen 390x844: full-screen dialog "Trip Registration" with a close X and a sticky footer "Close" / "Save Booking". Same design system. Show step "3 Route Selection" with the step indicator 1-2-3 at the top (1 and 2 done): "Pickup Address*" red pin "9120 SW 72nd St, Miami, FL 33173" with a green check, "City: Kendall"; "Dropoff Address*" blue pin "1840 NW 7th Ave, Miami, FL 33136", "City: Miami"; switch "Create Return Trip?" on, "Return time*" 11:30; below, a compact Google map with both pins, the route and chip "Distance: 14.2 mi".
```

### M4 · Sugerencias de dirección
```text
Mobile web screen 390x844: the "Trip Registration" dialog with "Pickup Address" focused, typed "Jackson Memorial Hosp", suggestion list open full width: "Jackson Memorial Hospital" / "Northwest 12th Avenue, Miami, FL" (highlighted), "Jackson Memorial Hospital Heliport", "Jackson Memorial Hospital Emergency Room" / "Northwest 19th Street, Miami, FL", footer "Powered by Google". Large touch rows. Same design system.
```

### M5 · Seguimiento
```text
Mobile web screen 390x844: full-screen "Trip #40233 tracking", status "In progress" (violet). Same design system. Top half: Google map with red pickup pin, blue destination pin and a green round vehicle marker with a van icon, caption "Live position updated 20 seconds ago". Bottom sheet: "Pickup" 455 NW 42nd Ave · "Requested 08:45 · ETA 08:47 · Arrived 08:49 · Picked up 08:55"; "Dropoff" Sunrise Dialysis Center · "Appointment 09:30 · ETA 09:14".
```

### M6 · Notificaciones
```text
Mobile web screen 390x844: "Notifications" with "Mark all as read" and a small "connected" label. Same design system. Scrollable tabs with icons and counts: "All 7", "Scheduled 2", "On the way 1", "Completed 2", "Cancelled 1", "Reactivated 1". Notice cards with a colored icon tile, title, text, time and "View trip": "Driver on the way" / "The driver is heading to the pickup of trip #40233." / "09:12 AM" (unread); "Trip scheduled" / "Trip #40238 on Oct 20 at 13:45 has a vehicle assigned." (unread); "Trip cancelled" / "Trip #40240 on Oct 20 at 15:30 was cancelled." (read). Bottom navigation, "Notifications" active.
```

### M7 · Catálogo
```text
Mobile web screen 390x844: "Catalog" with search "Search by name, city, phone…", horizontally scrolling group chips "All groups", "NEMT companies 5", "NEMT brokers 1", a "Filters" button and segmented "All / Contracted / Not contracted". "7 results · 3 contracted". Provider cards: building icon, name, group, city + county, phone, labels, and a button: "Coastal Care Transit" (Contracted, Operates in Raphael, "Remove"), "Sunshine Stretcher Services" (Private ambulance companies, Hialeah, "Contract"), "Keys Care Shuttle" (Inactive, "Contract" disabled). Same design system.
```

### M8 · Ficha del Provider
```text
Mobile web screen 390x844: full-screen "Coastal Care Transit", "NEMT companies", labels "Contracted", "Operates in Raphael". Sections "CONTACT" (address, county, tappable phone (305) 555-0400, email, website, contact Laura Méndez) and "REGULATORY" (NPI 1234567890, service level, coverage area, license expires Dec 31, 2027). Sticky footer "Edit" and "Remove". Same design system.
```

### M9 · Admin › Usuarios
```text
Mobile web screen 390x844: "Administration" with scrollable tabs "Users" (active), "Organization", "Billing". Button "New user". User cards: "Ana López" @ana.lopez · you, labels "Admin", "Active", "Edit"; "Miguel Santos" @msantos, "Booking", "Active", "Edit", "Set password", "Disable"; "Daniel Reyes" @dreyes, "Booking", "Disabled" (muted card), "Enable". Same design system.
```

### M10 · Admin › Organización y API key
```text
Mobile web screen 390x844: "Administration", tab "Organization". Card "Your organization": Sunrise Dialysis Center, Active, phone (305) 555-0100, address 1840 NW 7th Ave, Miami, FL 33136, contact Ana López, button "Edit contact details". Card "API key": masked key "••••••••••••••••", buttons "Show" and "Copy", warning "Keep it secret: anyone with this key can create and cancel trips for your organization." Same design system.
```

### M11 · Admin › Facturación
```text
Mobile web screen 390x844: "Administration", tab "Billing". Card "Funding source" (Sunrise Dialysis Center, Account SDC-2041, trip requirements as check rows, "Edit"). Card "Your billing items": Wheelchair base fee · UNIT · has rates; Mileage · MILE; After-hours surcharge · UNIT. Card "Rates on your funding source" as stacked rate cards: "Wheelchair base fee · WCH · $35.00 · Oct 1 → Dec 31, 2026" with "Edit" and "Close"; "Loading Fee · STR · $120.00" labeled "Office" (read only). Same design system.
```

### M12 · Diálogos y estados
```text
Mobile web screen 390x844: three states side by side on the canvas. (1) Bottom-sheet "Change password" with three password fields, "Show passwords" and "Change password". (2) Confirmation dialog "Are you sure you want to cancel 2 trips?" with "Cancel" and "OK". (3) Empty Trips list: line illustration of an empty calendar day, "No trips on these dates", "Choose other dates, or book a new trip." Same design system.
```

## Al terminar
Guarda capturas, la exportación y el **DESIGN.md exportado** en `design/proposals/stitch/AAAA-MM-DD-mobile/`.

## Historial
| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-10-08 | Primera versión |
| 1.1 | 2026-10-08 | S1: el color del nombre «Raphael» no está decidido |
