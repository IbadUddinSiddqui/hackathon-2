import { describe, it, expect } from "vitest";
import {
  isLocale,
  localeDir,
  localeFromCookie,
  t,
  dictKeys,
  dictsComplete,
  LOCALE_COOKIE,
} from "./i18n";

describe("isLocale", () => {
  it("accepts only en/ur", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ur")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});

describe("localeDir", () => {
  it("ur is RTL, en is LTR", () => {
    expect(localeDir("ur")).toBe("rtl");
    expect(localeDir("en")).toBe("ltr");
  });
});

describe("localeFromCookie", () => {
  it("parses the locale cookie and falls back to en", () => {
    expect(localeFromCookie(`${LOCALE_COOKIE}=ur; other=1`)).toBe("ur");
    expect(localeFromCookie("other=1")).toBe("en");
    expect(localeFromCookie(null)).toBe("en");
    expect(localeFromCookie(`${LOCALE_COOKIE}=xx`)).toBe("en");
  });
});

describe("t", () => {
  it("translates known keys and falls back to English", () => {
    expect(t("ur", "nav.home")).toBe("ہوم");
    expect(t("en", "nav.home")).toBe("Home");
    expect(t("ur", "missing.key.xyz")).toBe("missing.key.xyz");
  });
});

describe("dictionaries", () => {
  it("both locales have identical key sets", () => {
    expect(dictsComplete()).toBe(true);
    expect(dictKeys().length).toBeGreaterThan(20);
  });
});
