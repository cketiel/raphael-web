import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import es from "../../messages/es.json";
import { buildProductionCsv, CSV_HEADERS, type CsvLocale } from "@/features/booking/productionReportCsv";
import { languageCookieName, resolveLocale } from "./locale";

/** Every key path of a message tree, arrays counted as one leaf. */
function keys(tree: unknown, prefix = ""): string[] {
  if (tree === null || typeof tree !== "object" || Array.isArray(tree)) return [prefix];
  return Object.entries(tree as Record<string, unknown>).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
}

describe("messages", () => {
  it("Spanish has exactly the keys English has", () => {
    // A key missing in one language shows its raw name on screen, and no compiler says so.
    expect(keys(es).sort()).toEqual(keys(en).sort());
  });

  it("the CSV headers are the same 47 columns in both languages", () => {
    expect(en.csv.headers).toEqual([...CSV_HEADERS]);
    expect(es.csv.headers).toHaveLength(CSV_HEADERS.length);
  });
});

describe("locale", () => {
  it("is English unless the stored value is a language the portal has", () => {
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("fr")).toBe("en");
    expect(resolveLocale("es")).toBe("es");
  });

  it("keys the cookie by user, with nothing but safe characters in its name", () => {
    expect(languageCookieName("42")).toBe("rb_lang_42");
    expect(languageCookieName("a;b=c d")).toBe("rb_lang_abcd");
  });
});

describe("CSV in Spanish", () => {
  it("translates headers and Yes/No, and keeps the column order", () => {
    const spanish: CsvLocale = {
      headers: es.csv.headers,
      yes: es.csv.yes,
      no: es.csv.no,
      formatDate: () => "20/10/2026",
    };
    const [header, row] = buildProductionCsv([{ date: "2026-10-20T00:00:00", willCall: true, canceled: false }], spanish)
      .replace("﻿", "")
      .split("\n");
    expect(header.split(",")[0]).toBe("Fecha");
    const cells = row.split(",");
    expect(cells).toHaveLength(47);
    expect(cells[0]).toBe('"20/10/2026"');
    expect(cells[23]).toBe('"Sí"');
    expect(cells[24]).toBe('"No"');
  });
});
