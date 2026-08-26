import { describe, expect, it } from "vitest";
import { buildOrganizationJsonLd } from "./structuredData";
import { GITHUB_URL } from "@/content/navigation";
import { SITE_URL } from "@/app/sitemap";

describe("buildOrganizationJsonLd", () => {
  it("produces a valid Organization node with identity fields", () => {
    const jsonLd = buildOrganizationJsonLd();
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe("Cevolta");
    expect(jsonLd.url).toBe(SITE_URL);
    expect(jsonLd.sameAs).toContain(GITHUB_URL);
  });

  it("includes an address with a country", () => {
    const jsonLd = buildOrganizationJsonLd();
    expect(jsonLd.address).toEqual({ "@type": "PostalAddress", addressCountry: "CL" });
  });

  it("includes a contactPoint agents can use to reach the project", () => {
    const jsonLd = buildOrganizationJsonLd();
    expect(jsonLd.contactPoint["@type"]).toBe("ContactPoint");
    expect(jsonLd.contactPoint.url).toBe(`${SITE_URL}/contact`);
  });

  it("round-trips through JSON.stringify/parse without loss", () => {
    const jsonLd = buildOrganizationJsonLd();
    expect(JSON.parse(JSON.stringify(jsonLd))).toEqual(jsonLd);
  });
});
