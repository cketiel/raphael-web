// Refreshes the OpenAPI snapshot from Raphael.Api DEV. The snapshot is committed on purpose:
// a build must not depend on the DEV server being up, and the diff shows contract changes.
import { writeFile } from "node:fs/promises";

const SPEC_URL = "https://app-raphael-dev-scus.azurewebsites.net/swagger/v1/swagger.json";

const response = await fetch(SPEC_URL);
if (!response.ok) {
  console.error(`No se pudo descargar la especificación: HTTP ${response.status}`);
  process.exit(1);
}

const spec = await response.json();
await writeFile(new URL("../openapi/raphael-api.json", import.meta.url), JSON.stringify(spec, null, 2) + "\n");
console.log(`Especificación actualizada: ${Object.keys(spec.paths ?? {}).length} rutas.`);
