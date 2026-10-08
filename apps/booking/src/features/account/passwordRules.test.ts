import { describe, expect, it } from "vitest";
import { passwordProblem } from "./passwordRules";

describe("passwordProblem", () => {
  it("accepts eight characters with letters and digits, different and confirmed", () => {
    expect(passwordProblem("old pass 1", "Clinic2026", "Clinic2026")).toBeNull();
    expect(passwordProblem("old", "contraseña9", "contraseña9")).toBeNull();
  });

  it("asks for every field", () => {
    expect(passwordProblem("", "Clinic2026", "Clinic2026")).toBe("password_required");
    expect(passwordProblem("old", "", "")).toBe("password_required");
  });

  it("refuses short passwords and ones without both letters and digits", () => {
    expect(passwordProblem("old", "abc123", "abc123")).toBe("password_too_short");
    expect(passwordProblem("old", "onlyletters", "onlyletters")).toBe("password_needs_letters_and_digits");
    expect(passwordProblem("old", "12345678", "12345678")).toBe("password_needs_letters_and_digits");
  });

  it("refuses the current password and a confirmation that does not match", () => {
    expect(passwordProblem("Clinic2026", "Clinic2026", "Clinic2026")).toBe("password_same_as_current");
    expect(passwordProblem("old", "Clinic2026", "Clinic2027")).toBe("password_mismatch");
  });
});
