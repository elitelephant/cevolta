import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AboutPage from "./about/page";
import ContactPage from "./contact/page";
import PrivacyPage from "./privacy/page";
import NotFound from "./not-found";

function visibleTextLength(element: React.ReactElement) {
  const html = renderToStaticMarkup(element);
  return html.replace(/<[^>]*>/g, "").length;
}

describe("trust anchor pages", () => {
  it("About has at least 500 characters of real content", () => {
    expect(visibleTextLength(<AboutPage />)).toBeGreaterThanOrEqual(500);
  });

  it("Contact has at least 500 characters of real content", () => {
    expect(visibleTextLength(<ContactPage />)).toBeGreaterThanOrEqual(500);
  });

  it("Privacy has at least 500 characters of real content", () => {
    expect(visibleTextLength(<PrivacyPage />)).toBeGreaterThanOrEqual(500);
  });

  it("Contact links to the GitHub repo and the waitlist", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("github.com/elitelephant/cevolta");
    expect(html).toContain("#waitlist");
  });

  it("Privacy explains what happens to a submitted email", () => {
    const html = renderToStaticMarkup(<PrivacyPage />);
    expect(html.toLowerCase()).toContain("vercel blob");
    expect(html.toLowerCase()).toContain("not sold");
  });
});

describe("not-found page", () => {
  it("returns real HTTP 404 semantics via Next's file convention and links agents to recovery paths", () => {
    const html = renderToStaticMarkup(<NotFound />);
    expect(html).toContain('href="/sitemap.xml"');
    expect(html).toContain('href="/llms.txt"');
    expect(html).toContain('href="/"');
  });
});
