import { describe, expect, it } from "vitest";
import sitemap, { SITE_URL } from "./sitemap";

describe("sitemap", () => {
  it("lists every indexable page as an absolute URL under the site origin", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toEqual([
      `${SITE_URL}/`,
      `${SITE_URL}/about`,
      `${SITE_URL}/contact`,
      `${SITE_URL}/privacy`,
    ]);
  });

  it("gives every entry a lastModified date", () => {
    for (const entry of sitemap()) {
      expect(entry.lastModified).toBeInstanceOf(Date);
    }
  });
});
