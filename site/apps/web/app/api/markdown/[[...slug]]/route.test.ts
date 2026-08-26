import { describe, expect, it } from "vitest";
import { GET } from "./route";

function callWithSlug(slug?: string[]) {
  return GET(new Request("https://cevolta.xyz/api/markdown"), {
    params: Promise.resolve({ slug }),
  });
}

describe("GET /api/markdown/[[...slug]]", () => {
  it("serves content/markdown/index.md for an empty slug", async () => {
    const res = await callWithSlug([]);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    expect(res.headers.get("Vary")).toBe("Accept");
    const body = await res.text();
    expect(body).toContain("# Cevolta");
  });

  it("serves content/markdown/about.md for slug ['about']", async () => {
    const res = await callWithSlug(["about"]);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("# About Cevolta");
  });

  it("returns a 404 with a markdown recovery body for an unknown page", async () => {
    const res = await callWithSlug(["nope"]);
    expect(res.status).toBe(404);
    expect(res.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
    const body = await res.text();
    expect(body).toContain("Sitemap");
    expect(body).toContain("Home");
  });

  it("rejects path-traversal attempts instead of reading outside content/markdown", async () => {
    const res = await callWithSlug(["..", "..", "package"]);
    expect(res.status).toBe(404);
  });
});
