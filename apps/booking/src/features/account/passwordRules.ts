/** Shortest password the portal accepts (decided 2026-10-07). */
export const PASSWORD_MIN_LENGTH = 8;

/** What is wrong with a password change, as a code the page turns into words. */
export type PasswordProblem =
  | "password_required"
  | "password_too_short"
  | "password_needs_letters_and_digits"
  | "password_same_as_current"
  | "password_mismatch";

/**
 * The portal's rules for a new password: at least eight characters, letters and digits, different
 * from the current one, and typed the same twice. Checked in the form and again in the BFF, which
 * is the one that counts. The backend only checks the current password and the confirmation.
 */
export function passwordProblem(current: string, next: string, confirm: string): PasswordProblem | null {
  if (!current || !next || !confirm) return "password_required";
  if (next.length < PASSWORD_MIN_LENGTH) return "password_too_short";
  if (!/\p{L}/u.test(next) || !/\p{Nd}/u.test(next)) return "password_needs_letters_and_digits";
  if (next === current) return "password_same_as_current";
  if (next !== confirm) return "password_mismatch";
  return null;
}
