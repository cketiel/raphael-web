# Prompts para Google Stitch · proyecto WEB (PC y tableta): «Raphael Booking Portal»

| | |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 2026-10-08 |
| **Herramienta** | [stitch.withgoogle.com](https://stitch.withgoogle.com) (gratuito, con límite mensual) |
| **Basado en** | [creative-brief.md](creative-brief.md) v1.0 |
| **Proyecto hermano** | [stitch-mobile.md](stitch-mobile.md) (teléfono) |

## Cómo trabajar
1. Proyecto nuevo de tipo **Web**: «Raphael Booking · Web». La tableta se diseña en este mismo proyecto, a 1024 px (horizontal) y 768 px (vertical).
2. **Modo:** el de exploración para S1 y S2, y el de mayor calidad para las pantallas buenas.
3. **Adjunta con el icono de imagen** las imágenes elegidas de la dirección de arte (`design/proposals/art-direction/…`) y el logo (`apps/booking/public/brand/raphael-mark.png`).
4. **Una pantalla por prompt y un cambio por retoque.** Haz captura tras cada acierto. Para alternativas, usa **Create Variant**.
5. Los prompts van en inglés y los textos de la interfaz entre comillas, en inglés (idioma por defecto del portal).
6. Longitud: `python scripts/measure_prompts.py design/prompts/stitch-web.md` (objetivo, menos de 1.800 caracteres por prompt).

---

## S1 · Etapa 3 · Contexto + página de Viajes (PC, 1440 px)
> 🇪🇸 El contexto del producto y la página principal con 6 de los 10 viajes del escenario (uno de cada estado importante).

```text
Desktop web app (1440 px) called "Raphael Booking Portal" where dialysis centers and hospitals book non-emergency medical transport for patients and follow each trip live. Vibe: calm, trustworthy, precise, quietly warm healthcare logistics. Brand: the attached pin logo, ocean blue #005070 to #50a0c0. Not a ride-hailing app, not an emergency app, not a gray spreadsheet. All UI text in English.

Screen "Trips":
- Left sidebar, the visual signature: logo "Raphael" + "Booking Portal", items with icons "Trips" (active), "Catalog", "Notifications" (badge "3"), "Admin"; clinic "Sunrise Dialysis Center" at the bottom.
- Top bar right: language button "EN", bell with "3", avatar "AL" + "Ana López".
- Header: "Trips", "Book, follow and manage your facility's trips.", buttons "Export Report" and "New Booking" (primary).
- Filter card: "Start Date" 10/20/2026, "End Date" 10/20/2026, "Search", "Today", "Tomorrow", search field "Find a trip".
- 4 summary cards with icons: "Total trips 10", "Billable trips 9", "Canceled trips 1", "Total billed value $612.40".
- Trips table, "Select all" checkbox, columns Trip, Time, Patient, Route, Status, Actions (track, edit, cancel icons). Route = red pin pickup line + blue pin destination line:
#40231 06:15 Marta Gutiérrez WCH, 2150 SW 8th St → Sunrise Dialysis Center, Finished (gray)
#40233 08:45 Luis Fernández WCH, 455 NW 42nd Ave → Sunrise Dialysis Center, In progress (violet)
#40234 09:20 Dorothy Williams STR, Palm Gardens Rehab → Jackson Memorial Hospital, Arrived (blue)
#40236 11:00 James O'Neil WCH, 7600 Biscayne Blvd → Mount Sinai Medical Center, Assigned (green)
#40239 14:00 Rosa Delgado WCH, Sunrise Dialysis Center → 3401 SW 22nd St, Late (orange)
#40240 15:30 Peter Novak AMB, 15400 SW 104th St → Sunrise Dialysis Center, Canceled (red)
```

## S2 · Etapa 3 · Variantes de un solo cambio (el menú lateral)
> 🇪🇸 Solo cambia el menú lateral, que es la seña de identidad. Lanza cada prompt por separado o con Create Variant.

```text
On the "Trips" screen, change only the left sidebar: deep ocean-blue background (#0b2f45), a soft teal glow behind the logo, white line icons, and a luminous teal accent bar plus a lighter pill on the active item "Trips". Keep everything else exactly as it is.
```
```text
On the "Trips" screen, change only the left sidebar: light frosted-white sidebar with a thin ocean-blue right border, ocean-blue icons, and a filled ocean-blue pill with white text for the active item "Trips". Keep everything else exactly as it is.
```
```text
On the "Trips" screen, change only the left sidebar: a vertical gradient from #005070 to #1f6f99 with a very subtle topographic map texture, a clinic card at the bottom with "Sunrise Dialysis Center" and "Ana López · Admin". Keep everything else exactly as it is.
```

## S3 · Etapa 3 · La misma página en tableta
> 🇪🇸 Cuando haya una variante favorita de PC, la misma página en tableta horizontal y vertical.

```text
Tablet web screen, landscape 1024 px: the same "Trips" screen, same app and style. The sidebar collapses to a 76 px icon rail (tooltips on hover, badge "3" on the bell icon). Summary cards in 2x2. The table keeps Trip, Time, Patient, Route, Status, Actions; the route wraps to two lines and is never cut. Touch targets at least 44 px. Same data.
```
```text
Tablet web screen, portrait 768 px: the same "Trips" screen, same app and style. No sidebar: a top bar with the logo, "EN", bell "3" and avatar "AL", and a menu button that opens the sections as a drawer. Trips shown as two-column cards: time + "#40233", status label, patient + space type, red pickup line, blue destination line, provider, action icons. Same data.
```

## Retoques · Etapa 4 · Un cambio por prompt
```text
On the "Trips" screen, {un único cambio}. Change nothing else.
```

---

## Etapa 5 · Todo el portal (solo con la variante elegida)
1. **Importa el DESIGN.md:** selecciona las pantallas → **Modify → Design System → DESIGN.md**. Desde ahí, todas las pantallas lo siguen.
2. **Una pantalla por prompt**, en PC (1440). Las de tableta, después, con «Same screen at 1024 px» o «at 768 px».
3. Si una tabla sale mal, hazla en dos pasos: primero una fila y después la tabla.

### W1 · Menús abiertos (idioma y usuario)
```text
Desktop web screen (1440 px): the "Trips" screen with the language menu open under the "EN" button. Same app and design system. Menu: header "LANGUAGE", items "English · EN" (selected, check mark) and "Español · ES". Show a second state on the right of the canvas: the user menu open under avatar "AL", header "Signed in as" / "Ana López", items "Change password" (key icon) and "Logout" (red, exit icon). Everything else as in "Trips".
```

### W2 · Login
```text
Desktop web screen (1440 px): "Login". Same design system. Split layout: left half a brand panel with the logo "Raphael", headline "Every trip of your facility, in one place.", text "Book non-emergency medical transport, follow it live and keep your providers at hand." and three features with icons "Book and edit trips in seconds", "Live notices as trips move", "Your contracted providers". Right half the form: "Raphael Booking Portal", "Sign in with your facility account.", fields "User" (person icon) and "Password" (key icon, show/hide eye), primary full-width button "LOGIN" with a sign-in icon. Calm, no stock photos.
```

### W3 · Formulario de viaje
```text
Desktop web screen (1440 px): modal dialog "Trip Registration" over the dimmed "Trips" screen, "Patient, schedule and route. Fields marked * are required." Same design system. Two columns.
Left, three numbered steps: "1 Patient Information": search "Search by name or code", "Phone*" (786) 555-0177, "DOB*" 03/14/1952, "Rider ID", "Gender*" Male, "Home Address*", "City*", "Zip*". "2 Logistics": "Date*" 10/21/2026, "Pickup*" 07:30, "Appt" 08:15, "Space Type*" AMB with an info icon, "Funding Source" Sunrise Dialysis Center (read only), "Provider" Coastal Care Transit. "3 Route Selection": "Pickup Address*" red pin "9120 SW 72nd St, Miami, FL 33173" with a green check, "City: Kendall"; "Dropoff Address*" blue pin "1840 NW 7th Ave, Miami, FL 33136", "City: Miami"; switch "Create Return Trip?" on, "Return time*" 11:30.
Right: "Interactive Route Map" with a Google map, red and blue pins and the route line, chip "Distance: 14.2 mi", hint "Drag a pin to adjust the exact pickup or drop-off point."; textareas "Pickup Instructions", "Dropoff Instructions"; "Return Trip Notes"; file drop "Attachment" "Word or PDF, optional."
Footer: "Close", primary "Save Booking" with a check icon.
```

### W4 · Sugerencias de dirección
```text
Desktop web screen (1440 px): the "Trip Registration" modal with the "Pickup Address" field focused, typed "Jackson Memorial Hosp", and its suggestion list open below. Same design system. Five suggestions, each a gray pin, a bold place and a muted address: "Jackson Memorial Hospital" / "Northwest 12th Avenue, Miami, FL" (highlighted), "Jackson Memorial Hospital Heliport", "Jackson Memorial Hospital Emergency Room" / "Northwest 19th Street, Miami, FL", "Jackson Memorial Hospital Internal Medicine Program", "Jackson Memorial Hospital North Garage". Small footer "Powered by Google". Everything else unchanged.
```

### W5 · Seguimiento
```text
Desktop web screen (1440 px): modal "Trip #40233 tracking" with status label "In progress" (violet). Same design system. Left column, two stop cards: red pin "Pickup", "455 NW 42nd Ave · Miami", rows "Requested 08:45", "ETA 08:47", "Arrived 08:49", "Picked up 08:55"; blue pin "Dropoff", "Sunrise Dialysis Center · 1840 NW 7th Ave", rows "Appointment 09:30", "ETA 09:14", "Arrived —", "Dropped off —". Right: large Google map with the red and blue pins and a green round vehicle marker with a van icon between them, caption "Live position updated 20 seconds ago".
```

### W6 · Notificaciones
```text
Desktop web screen (1440 px): "Notifications", "Notices about your facility's trips from the last 7 days. Read marks are kept in this browser." Same design system. Right of the header a small "connected" label with a green dot and "Mark all as read". Tabs with icons and counts: "All 7" (active, red dot), "Scheduled 2", "On the way 1", "Completed 2", "Cancelled 1", "Reactivated 1". List rows with a colored icon tile per kind, title, text and time, unread rows tinted with a dot, and buttons "Mark as read" and "View trip": "Driver on the way" / "The driver is heading to the pickup of trip #40233." / "09:12 AM" (unread); "Trip scheduled" / "Trip #40238 on Oct 20 at 13:45 has a vehicle assigned." / "08:55 AM" (unread); "Trip completed" / "Trip #40232 was completed: the patient reached the destination." / "08:11 AM" (unread); "Trip cancelled" / "Trip #40240 on Oct 20 at 15:30 was cancelled." / "07:48 AM"; "Trip reactivated" / "Trip #40236 on Oct 20 at 11:00 is active again." / "Yesterday 5:20 PM".
```

### W7 · Viaje resaltado desde un aviso
```text
Desktop web screen (1440 px): the "Trips" screen after "View trip" from a notice: the row "#40233 Luis Fernández, In progress" is highlighted with a soft amber background and an amber left bar, scrolled into view. Same design system. Change nothing else.
```

### W8 · Catálogo
```text
Desktop web screen (1440 px): "Catalog", "Find providers and keep the ones your facility works with." Same design system. Filter card: search "Search by name, city, phone…", group chips "All groups" (active), "NEMT companies 5", "NEMT brokers 1", "Private ambulance companies 1", selects "All counties", "All cities", segmented "All / Contracted / Not contracted". "7 results · 3 contracted". Table with columns Name (building icon), Group, Place, Phone, Status, Actions: Coastal Care Transit, NEMT companies, Miami, Miami-Dade, FL, (305) 555-0400, labels "Contracted" + "Operates in Raphael", button "Remove"; Bayside Medical Rides, Fort Lauderdale, Broward, "Contracted" + "Operates in Raphael", "Remove"; Everglades Wheelchair Van, Homestead, "Contracted", "Remove"; Sunshine Stretcher Services, Private ambulance companies, Hialeah, "Contract"; Palm Coast Medical Transport, West Palm Beach, "Operates in Raphael", "Contract"; Keys Care Shuttle, Key Largo, Monroe, "Inactive", "Contract" disabled.
```

### W9 · Ficha del Provider
```text
Desktop web screen (1440 px): modal "Coastal Care Transit" with a building icon, subtitle "NEMT companies", labels "Contracted" and "Operates in Raphael". Same design system. Two sections. "CONTACT": Address 2400 NW 36th St, Miami, FL 33142; County Miami-Dade; Phone (305) 555-0400; Email dispatch@coastalcare.example; Website coastalcare.example; Contact person Laura Méndez. "REGULATORY": NPI 1234567890; Service level Wheelchair and ambulatory; Coverage area Miami-Dade and Broward; EMS license —; License expires Dec 31, 2027; Plan segment —. Footer "Edit" (pencil) and "Remove" (red outline).
```

### W10 · Admin › Usuarios
```text
Desktop web screen (1440 px): "Administration", "Your organization's users, details and billing." Same design system. Tabs with icons "Users" (active), "Organization", "Billing". Card "Users of your organization" with a people icon and button "New user". Table Full name, Username, Email, Phone, Role, State, Actions: Ana López (you) @ana.lopez ana.lopez@sunrisedialysis.example, role "Admin" (violet), "Active", only "Edit"; Miguel Santos @msantos (305) 555-0201, "Booking" (blue), "Active", "Edit", "Set password", "Disable" (red); Grace Park @gpark, Booking, Active; Daniel Reyes @dreyes, Booking, "Disabled" (gray, row muted), "Enable".
```

### W11 · Admin › Organización
```text
Desktop web screen (1440 px): "Administration", tab "Organization" active. Same design system. Two cards side by side. "Your organization" with a building icon and "Edit contact details": Name Sunrise Dialysis Center; State Active; Funding source Sunrise Dialysis Center; Phone (305) 555-0100; Email info@sunrisedialysis.example; Website sunrisedialysis.example; Address 1840 NW 7th Ave, Miami, FL 33136; Contact person Ana López; note "The name, the state and the funding source assigned are managed by the office." Card "API key" with a key icon: "Use it to connect your own system to Raphael through the integration API.", a masked key "••••••••••••••••••••••••••••••••" and "Show"; warning "Keep it secret: anyone with this key can create and cancel trips for your organization."
```

### W12 · Admin › Facturación
```text
Desktop web screen (1440 px): "Administration", tab "Billing" active. Same design system. Three stacked cards. "Funding source" with "Edit": Name Sunrise Dialysis Center, Account number SDC-2041, and "Trip requirements" with checks: Patient signature at pickup ✓, Patient signature at drop-off ✓, Driver signature —, Odometer reading required —, Barcode scan required —. "Your billing items" with "New billing item": Wheelchair base fee · UNIT · has rates; Mileage · MILE · has rates; After-hours surcharge · UNIT (each "Edit", "Delete" disabled when it has rates). "Rates on your funding source" with "New rate": table Billing item, Space type, Rate, Per, Min / Max, Validity, Actions: Wheelchair base fee WCH $35.00, Oct 1, 2026 → Dec 31, 2026, "Edit" "Close"; Mileage WCH $2.25 per 1; Loading Fee STR $120.00 label "Office" read only; Miles AMB $1.75 label "Office".
```

### W13 · Cambiar contraseña y diálogos
```text
Desktop web screen (1440 px): the "Trips" screen dimmed with a small modal "Change password" (key icon): "Current password", "New password" with hint "At least 8 characters, with letters and numbers.", "Confirm new password", checkbox "Show passwords", buttons "Cancel" and "Change password". On the right of the canvas, a second state: confirmation dialog with a warning icon "Are you sure you want to cancel 2 trips?" and buttons "Cancel" and "OK".
```

### W14 · Estados vacío, cargando y error
```text
Desktop web screen (1440 px): three states of the "Trips" list card side by side. Same design system. (1) Empty: friendly line illustration of an empty calendar day, "No trips on these dates", "Choose other dates, or book a new trip." (2) Loading: skeleton rows. (3) Error: inline danger notice "Unable to load trips right now." with "Try again".
```

## Al terminar
Guarda capturas, la exportación (código o Figma) y el **DESIGN.md exportado** en `design/proposals/stitch/AAAA-MM-DD-web/`.

## Historial
| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-10-08 | Primera versión |
