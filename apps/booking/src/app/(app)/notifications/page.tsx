import { notFound } from "next/navigation";
import { NotificationCenter } from "@/features/notifications/NotificationCenter";
import { getSession, portalKind } from "@/server/session";

/** Notifications: the signed-in layout has already checked the session and opened the live channels. */
export default async function NotificationsPage() {
  // An external Provider's user has no notices yet.
  const session = await getSession();
  if (session.user && portalKind(session.user) === "provider") notFound();
  return <NotificationCenter />;
}
