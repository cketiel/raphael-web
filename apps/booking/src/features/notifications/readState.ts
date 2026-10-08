/**
 * Which notices this user has read, in this browser.
 *
 * The backend's recipient is the whole integrator, shared by every user of the clinic and by its
 * API Key client, so marking it there would mark it for all of them. Kept per user instead, like
 * the language: on another computer the notices show as unread again (WEB_STACK.md §6.2).
 *
 * Stored as { notificationId: expiresAtUtc }, so entries are dropped once the notice itself is gone
 * and the record never outgrows the seven-day window.
 */
export type ReadMap = Record<string, string>;

export function readStateKey(userId: string) {
  return `rb_notif_read_${userId.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

export function parseReadState(raw: string | null): ReadMap {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as ReadMap) : {};
  } catch {
    return {};
  }
}

// What the page renders from: the stored text, read through useSyncExternalStore so the server
// render (no storage) and the browser agree, and every component sees the same marks.
const listeners = new Set<() => void>();

export function subscribeReadState(listener: () => void) {
  listeners.add(listener);
  // Another tab of the same user marking notices read.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStoredState(userId: string): string | null {
  try {
    return window.localStorage.getItem(readStateKey(userId));
  } catch {
    // Private windows and blocked storage: everything simply shows as unread.
    return null;
  }
}

export function saveReadState(userId: string, state: ReadMap) {
  try {
    window.localStorage.setItem(readStateKey(userId), JSON.stringify(state));
  } catch {
    // Same as above: losing the read marks is harmless.
  }
  listeners.forEach((l) => l());
}

export function pruneExpired(state: ReadMap, now = Date.now()): ReadMap {
  const kept: ReadMap = {};
  for (const [id, expiresAtUtc] of Object.entries(state)) {
    const expires = Date.parse(expiresAtUtc);
    // An unparseable date is kept: dropping it would only bring an old notice back as unread.
    if (Number.isNaN(expires) || expires > now) kept[id] = expiresAtUtc;
  }
  return kept;
}
