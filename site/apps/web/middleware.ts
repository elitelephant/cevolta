import { NextRequest, NextResponse } from "next/server";
import { appendVaryAccept, preferredType } from "@/lib/contentNegotiation";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Explicit .md URL (the rel="alternate" target agents can follow without
  // sending an Accept header at all): always serve Markdown.
  if (pathname.endsWith(".md")) {
    const url = req.nextUrl.clone();
    url.pathname = `/api/markdown${pathname.slice(0, -3)}`;
    const rewritten = NextResponse.rewrite(url);
    appendVaryAccept(rewritten.headers);
    return rewritten;
  }

  const acceptHeader = req.headers.get("accept");
  const chosen = preferredType(acceptHeader);

  if (chosen === "text/markdown") {
    const url = req.nextUrl.clone();
    // Avoid a trailing slash for "/" so the catch-all route sees slug=[].
    url.pathname = pathname === "/" ? "/api/markdown" : `/api/markdown${pathname}`;
    const rewritten = NextResponse.rewrite(url);
    appendVaryAccept(rewritten.headers);
    return rewritten;
  }

  if (chosen === null && acceptHeader) {
    return new Response("Not Acceptable\n\nAvailable: text/html, text/markdown\n", {
      status: 406,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  const res = NextResponse.next();
  appendVaryAccept(res.headers);
  return res;
}

export const config = {
  // Run on everything except Next internals, API routes, and the
  // machine-readable metadata routes that already set their own Content-Type.
  matcher: [
    "/((?!api/|_next/|_vercel/|sitemap\\.xml|robots\\.txt|llms\\.txt|icon\\.svg|opengraph-image|favicon\\.ico).*)",
  ],
};
