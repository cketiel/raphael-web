# Brief creativo: «Raphael Booking Portal» (para diseñadores)

| | |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 2026-10-08 |
| **Basado en** | El portal en producción y su rediseño provisional (`apps/booking`, commit `e274c11`) |
| **Datos** | Ficticios con la forma real, escenario del 2026-10-20 (ver [`data/`](data/README.md)) |

> Es la **fuente común** para todos los diseñadores, personas o herramientas de IA (Gemini, Stitch,
> Claude Design). Los prompts de cada herramienta salen de aquí. Si cambia un concepto, se cambia aquí primero.

---

## 1. El proyecto en una frase
El **Raphael Booking Portal** es la web donde las clínicas, centros de diálisis y hospitales reservan
**transporte médico no urgente** (NEMT) para sus pacientes, lo siguen en vivo y gestionan su cuenta.
Idea central: **«Cada paciente llega a su cita, y tú lo sabes en todo momento.»**

Forma parte del ecosistema Raphael: el **mismo lenguaje visual** se usará después en la página pública
de ETA (el paciente ve cuándo llega su vehículo) y en el portal corporativo. Diseña pensando en una
familia, no en una pantalla suelta.

## 2. Para quién
- **Coordinadores de transporte de una clínica** (30–60 años). Reservan y revisan decenas de viajes al
  día, con prisa y con el teléfono sonando. No son técnicos. Usan sobre todo **PC con pantalla ancha**.
- **Recepción y enfermería**, en una **tableta** en el mostrador: consultan si el vehículo ya viene, cancelan, reservan la vuelta.
- **La administradora de la clínica**: da de alta usuarios, mantiene los datos de la organización, los Providers con los que trabaja y la facturación.
- **Fuera de la oficina**, en el **teléfono**: comprobar un viaje, ver un aviso.
- **El diseño es líquido y se diseña en tres tamaños: PC (1440 px), tableta (1024 y 768 px) y teléfono (390 px).** Ninguno es «la versión reducida» del otro: cada uno tiene su composición.

## 3. Personalidad
- **Tranquilo y fiable:** es salud. La interfaz transmite que todo está bajo control, incluso cuando algo falla.
- **Preciso y eficiente:** mucha información, bien jerarquizada. Una coordinadora encuentra un viaje en segundos.
- **Humano:** detrás de cada fila hay un paciente que no puede faltar a su diálisis. Cercano, nunca frío ni burocrático.
- **Profesional y con carácter:** el **menú lateral** es la seña de identidad. Tiene que ser vistoso y elegante a la vez, no un listado gris.
- **Evitar:**
  - el aspecto de app de viajes de consumo (Uber, Lyft): esto no es un taxi;
  - las sirenas, ambulancias y cruces rojas de emergencia: es transporte **no** urgente;
  - los degradados chillones, el neón y el aspecto de juego o de criptomoneda;
  - el gris corporativo de hoja de cálculo;
  - las fotos de archivo de médicos sonrientes.

## 4. Lo mínimo que hay que saber del dominio
Un **viaje** lleva a un paciente de un punto de recogida a una cita y, a menudo, de vuelta. Ejemplo:
*viaje #40233, Luis Fernández, en silla de ruedas (WCH), recogida a las 08:45 en su casa (455 NW 42nd Ave,
Miami) para su cita de diálisis de las 09:30 en Sunrise Dialysis Center. Estado: en curso; llegada estimada 09:14.*

- **Tipo de espacio:** AMB (camina), WCH (silla de ruedas), BWCH (silla bariátrica), STR (camilla). Condiciona el vehículo.
- **Estados** del viaje, en su orden de vida: Scheduled → Assigned → Accepted → (Waiting, Late) → Arrived → InProgress → Finished; o Canceled.
- **Provider:** la empresa de transporte que hace el viaje. Si no hay ninguno, lo hace Raphael, el broker principal.
- **Jerarquía visual en la lista de viajes:**
  1. hora de recogida y paciente;
  2. estado;
  3. ruta (recogida → destino);
  4. tipo de espacio y Provider;
  5. acciones (seguir, editar, cancelar).
- **Reglas de representación:**
  - el número de viaje siempre con almohadilla: «#40233»;
  - **recogida en rojo y destino en azul**, en la lista, en el formulario y en el mapa. Es una convención que los usuarios ya conocen;
  - cada estado tiene **un color fijo** en todo el producto (§5.3);
  - las direcciones son largas y no se cortan a una sola línea: se pueden partir, pero no esconder.

## 5. Conceptos que atraviesan todo el diseño
1. **Diseño líquido en tres tamaños.**
   - **PC:** menú lateral fijo y tablas.
   - **Tableta:** menú lateral **compacto, solo con iconos**, desplegable, o una barra superior. Propón cuál.
   - **Teléfono:** navegación inferior fija y tarjetas en lugar de tablas.
2. **El menú lateral es el protagonista del marco.**
   - Lleva el logo, las cuatro secciones (Viajes, Catálogo, Notificaciones, Admin) con su icono, el contador de avisos sin leer y la sección activa muy clara.
   - Admin solo lo ven los administradores.
   - Explora libremente: fondo de color de marca, textura sutil, ilustración, agrupaciones, el nombre de la clínica…
3. **Color de los estados**, el mismo en todas partes: Scheduled azul · Assigned verde · Accepted cian · Waiting ámbar · Late naranja · Arrived azul · InProgress violeta · Finished gris · Canceled rojo. Puedes proponer otro estilo de etiqueta (punto, píldora, barra lateral…), pero sin cambiar el significado de cada color.
4. **Tiempo real visible:**
   - un indicador discreto del estado de la conexión en vivo (conectado, reconectando, desconectado);
   - la campana con contador;
   - los viajes que cambian de estado sin recargar.
5. **Dos idiomas, inglés y español**, que se eligen en un menú de idioma en la barra superior. El español es **un 25 % más largo**: los botones y las etiquetas tienen que admitirlo sin romperse.
6. **Entorno de pruebas:** fuera de producción, una franja fina en lo alto avisa «DEV environment — not production». Tiene que convivir con el diseño sin parecer un error.
7. **Estados de cada lista:** en reposo, cargando, vacía (con qué hacer) y error. Se diseñan, no se improvisan.
8. **Los iconos:** hoy se usa Bootstrap Icons. Puedes proponer otro juego, siempre que sea **un solo juego abierto** y coherente.
9. **Mapas de Google:** el formulario y el seguimiento llevan un mapa de Google real. Se puede elegir su estilo de colores, pero sigue siendo Google Maps, con su atribución y la leyenda «Powered by Google» bajo las sugerencias de dirección.

## 6. Pantallas
**Escenario de todas las maquetas:** martes 20 de octubre de 2026, 9:40 a. m. Sesión de Ana López, administradora de Sunrise Dialysis Center. Entorno: producción (sin franja DEV), salvo en una pantalla de ejemplo.

**Primera ronda, solo esta:**
1. **Viajes** (página principal): en la cabecera, el título, «Export Report» (siempre visible) y «New Booking». Debajo:
   - el filtro: fecha desde y hasta, «Search», atajos «Today» y «Tomorrow» y el buscador de viajes del día;
   - el resumen del día, con cuatro cifras;
   - la lista de los 10 viajes, con selección múltiple y «Cancel selected»;
   - las acciones de cada viaje: seguir, editar y cancelar.

**Después, con la dirección elegida (todo el portal):**
2. **Marco:** menú lateral (PC), menú compacto (tableta), navegación inferior (teléfono) y barra superior con idioma, campana y usuario.
3. **Menú de idioma abierto** y **menú de usuario abierto** (cambiar contraseña, cerrar sesión).
4. **Login:** usuario y contraseña, con mostrar u ocultar. Va siempre en inglés.
5. **Formulario de viaje** (alta y edición), en tres pasos:
   - paciente, con el buscador de pacientes existentes;
   - logística: fecha, horas, tipo de espacio, funding source y Provider;
   - ruta: las dos direcciones con sugerencias de Google, «Create Return Trip?» y la hora de vuelta;
   - al lado, el mapa con la ruta y la distancia, las instrucciones de recogida y entrega y el adjunto.
6. **Sugerencias de dirección abiertas**: lugar y dirección, con «Powered by Google».
7. **Seguimiento del viaje en curso:** estado, recogida y destino con sus horas (pedida, estimada, llegada) y el mapa con el vehículo en vivo.
8. **Notificaciones:** pestañas (All, Scheduled, On the way, Completed, Cancelled, Reactivated) con contadores; avisos leídos y sin leer; «Mark all as read»; «View trip» en cada aviso.
9. **Viaje resaltado** al llegar desde un aviso.
10. **Catálogo de Providers:** buscador, grupos, condado, ciudad y «Contracted / Not contracted»; lista con «Contract» o «Remove».
11. **Ficha de un Provider** y su **edición**.
12. **Admin › Users:** lista y formulario de usuario, poner contraseña, habilitar y deshabilitar.
13. **Admin › Organization:** datos de la clínica y la **API key** (oculta, «Show», «Copy»).
14. **Admin › Billing:**
    - el funding source y los requisitos del viaje;
    - los Billing Items propios;
    - las tarifas, con las de la oficina en solo lectura y las propias que se cierran por fecha.
15. **Cambiar contraseña** y los **diálogos** de confirmación («Cancel 2 trips?») y aviso.
16. **Estados:** lista vacía, cargando y error, en Viajes y en Notificaciones.

Navegación: Viajes · Catálogo · Notificaciones · Admin.

## 7. Anatomía de una fila de viaje (propuesta, mejorable)
```text
PC (fila de tabla)
[☐] #40233 │ 08:45 → 09:30  │ Luis Fernández        │ ● 455 NW 42nd Ave, Miami                    │ [● In progress] │ [⌖][✎][✕]
           │ Tue, Oct 20     │ WCH · Raphael (default)│ ● Sunrise Dialysis Center · 1840 NW 7th Ave │                 │

Teléfono (tarjeta)
┌──────────────────────────────────────────┐
│ ☐ 08:45  #40233          [● In progress] │
│ Luis Fernández · WCH                      │
│ ● 455 NW 42nd Ave, Miami                  │
│ ● Sunrise Dialysis Center                 │
│ Raphael (default)        [⌖] [✎] [✕]      │
└──────────────────────────────────────────┘
```
Puedes proponer otra disposición, siempre que respete la jerarquía de §4 y que las direcciones no se corten.

## 8. Datos para las maquetas (no inventes otros)
Todos están en [`data/`](data/README.md). Son ficticios con la forma real, porque este repositorio es público.

**Viajes del 20/10/2026** (`trips.csv`):

| # | Recogida | Cita | Paciente | Tipo | Estado | Desde → hasta | Provider |
|---|---|---|---|---|---|---|---|
| 40231 | 06:15 | 07:00 | Marta Gutiérrez | WCH | Finished | 2150 SW 8th St → Sunrise Dialysis Center | Raphael (default) |
| 40232 | 07:30 | 08:15 | Robert Chen | AMB | Finished | 9120 SW 72nd St, Kendall → Sunrise Dialysis Center | Coastal Care Transit |
| 40233 | 08:45 | 09:30 | Luis Fernández | WCH | InProgress | 455 NW 42nd Ave → Sunrise Dialysis Center | Raphael (default) |
| 40234 | 09:20 | 10:00 | Dorothy Williams | STR | Arrived | Palm Gardens Rehab, Hollywood → Jackson Memorial Hospital | Bayside Medical Rides |
| 40235 | 10:30 | 11:15 | Ana Torres | AMB | Accepted | 1201 Brickell Bay Dr → Sunrise Dialysis Center | Raphael (default) |
| 40236 | 11:00 | 11:45 | James O'Neil | WCH | Assigned | 7600 Biscayne Blvd → Mount Sinai Medical Center | Coastal Care Transit |
| 40237 | 12:30 | 13:15 | Carmen Ruiz | AMB | Scheduled | 620 W 49th St, Hialeah → Sunrise Dialysis Center | Raphael (default) |
| 40238 | 13:45 | 14:30 | Harold Brooks | BWCH | Scheduled | 2800 N Ocean Dr, Hollywood → Sunrise Dialysis Center | Bayside Medical Rides |
| 40239 | 14:00 | 14:45 | Rosa Delgado | WCH | Late | Sunrise Dialysis Center → 3401 SW 22nd St | Raphael (default) |
| 40240 | 15:30 | — | Peter Novak | AMB | Canceled | 15400 SW 104th St, Kendall → Sunrise Dialysis Center | Raphael (default) |

**Resumen del día:** Total trips 10 · Billable trips 9 · Canceled trips 1 · Total billed value $612.40.
**Usuario:** Ana López, iniciales «AL», administradora. **Avisos sin leer:** 3. **Idioma:** EN.

El resto (avisos, Providers, Admin, seguimiento) está en sus CSV.

## 9. Qué es obligatorio y qué es libre
**Obligatorio:**
- la interfaz se diseña **en inglés**, preparada para el español (§5.5);
- solo los datos de §8 y de `data/`;
- la jerarquía de §4, con la recogida en rojo y el destino en azul, y los colores de estado de §5.3;
- en Viajes: «Export Report» y «New Booking» siempre visibles, el buscador, el resumen y la selección múltiple;
- los tres tamaños de §5.1;
- contraste **WCAG AA** en todo el texto, zonas táctiles de **44 px** como mínimo en tableta y teléfono, texto de los campos de **16 px** como mínimo;
- el foco del teclado visible;
- Google Maps real con su atribución, y «Powered by Google» bajo las sugerencias;
- nada de logos ni marcas de terceros, salvo Google donde lo exige;
- la marca Raphael: el **pin con una figura** del favicon y su gama de azul océano (#005070 → #50a0c0) como punto de partida. Se puede refinar la paleta, pero el logotipo no se cambia.

**Libre (sé creativo):**
- el estilo, el ajuste de la paleta y las tipografías (dos como máximo);
- el carácter del menú lateral;
- la composición de cada pantalla y la forma de las tarjetas de resumen;
- la forma de mostrar el estado y la ruta;
- las ilustraciones de los estados vacíos;
- las microinteracciones;
- cómo se resuelve el menú en tableta.

**Nos encantaría:** 2–3 direcciones visuales claramente distintas de la página de Viajes antes de diseñar el resto, y que **al menos una sorprenda**.

## 10. Realismo técnico
- Se implementa en **Next.js con Tailwind CSS**. Las propuestas tienen que poder expresarse en tokens (colores, tipografía, radios, sombras, espaciado), sin imágenes pesadas.
- **Fuentes de Google Fonts**, dos como máximo.
- **Modo claro obligatorio; el oscuro, deseable.** Se usa muchas horas seguidas en la oficina.
- Se respeta la preferencia de «menos movimiento».
- Las pantallas de PC conviven con un mapa de Google y con tablas de 10 a 200 filas: la densidad importa.
- **Conexión:** oficina con buena conexión; tableta y teléfono pueden ir por datos móviles.
