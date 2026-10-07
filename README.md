# raphael-web

Webs del ecosistema Raphael, en un solo monorepo TypeScript (Next.js + React).

| App | Qué es | Despliegue |
|---|---|---|
| `apps/booking` | Raphael Booking Portal: reservas de las clínicas (Integrators) | Servidor Node (BFF). Azure App Service, `raphaelbooking.com`, cuando se libere |
| `apps/eta` | Página pública de ETA (prueba de concepto del export estático) | Archivos estáticos a GoDaddy (`etamilanes.com`) |
| `libs/api-client` | Tipos generados del Swagger de Raphael.Api | — |

Las librerías compartidas viven en `libs/`, no en `packages/`: la regla de permisos `Read(**/packages/**)`
del meta-repo oculta cualquier carpeta con ese nombre.

## Arrancar Booking en local

```bash
pnpm install
cp apps/booking/.env.example apps/booking/.env.local   # y rellenar
pnpm dev:booking                                        # http://localhost:3000, contra Azure DEV
```

## Comprobaciones

```bash
pnpm --filter booking typecheck
pnpm --filter booking lint
pnpm --filter booking test
pnpm --filter booking build
```

## Tipos de la API

```bash
pnpm --filter @raphael/api-client fetch-spec   # descarga el Swagger de DEV
pnpm api:types                                 # regenera libs/api-client/src/schema.d.ts
```

## Documentos

La paridad con la Booking Web antigua, las decisiones de stack y hosting, y los fallos de backend
pendientes se documentan en el repositorio privado del ecosistema.
