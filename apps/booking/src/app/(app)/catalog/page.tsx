import { CatalogBrowser } from "@/features/catalog/CatalogBrowser";
import { getSession } from "@/server/session";

/**
 * The catalog. Whether to offer "contract" and "edit" is decided here only for the screen: the
 * backend checks it again on every call.
 */
export default async function CatalogPage() {
  const session = await getSession();
  // A clinic's admin: role 1 with an integrator (CATALOG_MODEL.md, "Administrador de una clínica").
  const isClinicAdmin = session.user?.role === "1" && session.user?.integratorId != null;

  return <CatalogBrowser isClinicAdmin={isClinicAdmin} />;
}
