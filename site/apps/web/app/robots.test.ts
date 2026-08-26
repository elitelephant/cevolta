import { describe, expect, it } from "vitest";
import robots from "./robots";
import { SITE_URL } from "./sitemap";

describe("robots", () => {
  it("allows all crawlers and points at the sitemap", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(result.rules).toEqual({ userAgent: "*", allow: "/" });
  });
});
