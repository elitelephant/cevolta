import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function requestFor(path: string, accept?: string) {
  const init = accept ? { headers: { accept } } : undefined;
  return new NextRequest(new URL(path, "https://cevolta.xyz"), init);
}

describe("middleware", () => {
  it("passes normal HTML requests through with Vary: Accept", () => {
    const res = middleware(requestFor("/about", "text/html"));
    expect(res.headers.get("Vary")).toBe("Accept");
    // NextResponse.next() carries this internal header when passing through.
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("rewrites to the markdown API route when Accept prefers text/markdown", () => {
    const res = middleware(requestFor("/about", "text/markdown"));
    const rewrite = res.headers.get("x-middleware-rewrite");
    expect(rewrite).toBe("https://cevolta.xyz/api/markdown/about");
    expect(res.headers.get("Vary")).toBe("Accept");
  });

  it("rewrites the root path to /api/markdown without a trailing slash", () => {
    const res = middleware(requestFor("/", "text/markdown"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://cevolta.xyz/api/markdown");
  });

  it("rewrites explicit .md URLs regardless of Accept header", () => {
    const res = middleware(requestFor("/about.md"));
    expect(res.headers.get("x-middleware-rewrite")).toBe("https://cevolta.xyz/api/markdown/about");
  });

  it("returns 406 when the client explicitly rejects everything we produce", () => {
    const res = middleware(requestFor("/about", "text/html;q=0, text/markdown;q=0"));
    expect(res.status).toBe(406);
    expect(res.headers.get("Vary")).toBe("Accept");
  });
});
