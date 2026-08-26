import { describe, expect, it } from "vitest";
import { appendVaryAccept, parseAccept, preferredType } from "./contentNegotiation";

describe("preferredType", () => {
  it("defaults to text/html when there is no Accept header", () => {
    expect(preferredType(null)).toBe("text/html");
  });

  it("picks text/markdown when explicitly requested", () => {
    expect(preferredType("text/markdown")).toBe("text/markdown");
  });

  it("prefers text/markdown when it has a higher q-value", () => {
    expect(preferredType("text/html;q=0.5, text/markdown;q=0.9")).toBe("text/markdown");
  });

  it("breaks q-value ties using client order", () => {
    expect(preferredType("text/markdown, text/html, */*")).toBe("text/markdown");
    expect(preferredType("text/html, text/markdown, */*")).toBe("text/html");
  });

  it("lets a specific range override a wildcard regardless of q", () => {
    // text/html is explicitly rejected (q=0); the wildcard must not resurrect it.
    expect(preferredType("text/html;q=0, */*;q=1")).toBe("text/markdown");
  });

  it("falls back to text/html for a bare */* wildcard", () => {
    expect(preferredType("*/*")).toBe("text/html");
  });

  it("returns null when everything we produce is explicitly rejected", () => {
    expect(preferredType("text/html;q=0, text/markdown;q=0")).toBeNull();
  });

  it("returns null for a completely unrelated Accept header", () => {
    expect(preferredType("application/json")).toBeNull();
  });
});

describe("parseAccept", () => {
  it("parses type, q-value, and ignores unknown params", () => {
    const entries = parseAccept("text/markdown;q=0.8;level=1, */*");
    expect(entries).toEqual([
      { type: "text/markdown", q: 0.8, specificity: 2 },
      { type: "*/*", q: 1, specificity: 0 },
    ]);
  });

  it("clamps out-of-range q-values into [0, 1]", () => {
    expect(parseAccept("text/html;q=5")[0].q).toBe(1);
    expect(parseAccept("text/html;q=-5")[0].q).toBe(0);
  });
});

describe("appendVaryAccept", () => {
  it("sets Vary: Accept when there is no existing Vary header", () => {
    const headers = new Headers();
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("Accept");
  });

  it("appends Accept to an existing Vary header", () => {
    const headers = new Headers({ Vary: "Accept-Encoding" });
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("Accept-Encoding, Accept");
  });

  it("does not duplicate Accept if already present (case-insensitive)", () => {
    const headers = new Headers({ Vary: "accept, Accept-Encoding" });
    appendVaryAccept(headers);
    expect(headers.get("Vary")).toBe("accept, Accept-Encoding");
  });
});
