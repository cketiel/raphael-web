# Datos para los diseñadores

| | |
|---|---|
| **Versión** | 1.0 |
| **Escenario** | Martes **20 de octubre de 2026, 9:40 a. m.** (hora de Miami). Centro de diálisis «Sunrise Dialysis Center», sesión de su administradora, Ana López |
| **Fuente** | Forma real de los datos del Booking Portal (TripReadDto, notificaciones, catálogo, Admin), con **valores ficticios** |

⚠️ **Todos los nombres de pacientes, teléfonos y domicilios son inventados**, y también la clínica y los
Providers. Este repositorio es público y los datos reales son información de salud protegida (PHI). Los
teléfonos usan el rango 555-01xx, reservado para ficción. Lo que sí es real: la estructura, los estados
de viaje, los tipos de espacio, los tipos de aviso y los hospitales públicos de Miami como destino.

Se adjuntan a las herramientas que aceptan archivos (Claude Design). En Stitch, los datos van dentro de los prompts.

| Archivo | Contenido |
|---|---|
| `trips.csv` | Los 10 viajes del centro en la fecha del escenario: la página principal |
| `summary.csv` | Las cuatro cifras del resumen de ese día |
| `notifications.csv` | 7 avisos de los últimos dos días, 3 sin leer |
| `providers.csv` | 7 Providers del catálogo: 3 contratados, 1 inactivo |
| `admin.csv` | Usuarios, organización, funding source, Billing Items y tarifas |
| `tracking.csv` | El viaje #40233, en curso, para la pantalla de seguimiento |

## Definiciones
| Columna | Definición |
|---|---|
| `trip_id` | Número del viaje. Se muestra como «#40233» |
| `pickup_time` / `appointment_time` | Hora de recogida pedida y hora de la cita, en hora de Miami, formato 24 h en los datos (la interfaz en inglés las muestra en 12 h si el diseño lo propone) |
| `space_type` | Cómo viaja el paciente. **AMB:** camina (ambulatorio). **WCH:** silla de ruedas. **BWCH:** silla de ruedas bariátrica. **STR:** camilla |
| `status` | Estado del viaje. Orden de vida: Scheduled → Assigned → Accepted → (Waiting / Late) → Arrived → InProgress → Finished. Canceled en cualquier momento |
| `provider` | Empresa que hace el viaje. «Raphael (default)» = el broker principal, sin Provider asignado |
| `miles` | Distancia por carretera, en millas |
| `round_trip` | Si la reserva creó también la vuelta |
| `kind` (avisos) | Los cinco tipos que recibe una clínica: TRIP_SCHEDULED, DRIVER_STARTED_TRIP, DRIVER_COMPLETED_TRIP, TRIP_CANCELLED, TRIP_REACTIVATED |
| `contracted` | La clínica trabaja con ese Provider: puede asignarle viajes |
| `operates_in_raphael` | El Provider tiene cuenta en Raphael y puede recibir viajes |
