import { notFound } from "next/navigation";
import { AdminPage } from "@/features/admin/AdminPage";
import { getSession } from "@/server/session";

/**
 * Admin: a clinic's admin only (role 1 with an integrator). Anyone else gets a 404, as the backend
 * would answer them; the tab is not even drawn for them.
 */
export default async function AdminRoute() {
  const session = await getSession();
  const isClinicAdmin = session.user?.role === "1" && session.user?.integratorId != null;
  if (!isClinicAdmin) notFound();
  return <AdminPage />;
}
