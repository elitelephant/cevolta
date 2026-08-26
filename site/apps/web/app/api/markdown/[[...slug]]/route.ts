import { readFile } from "node:fs/promises";
import path from "node:path";

const NOT_FOUND_BODY = `# Not found

There's no page at that address.

- [Home](https://cevolta.xyz/)
- [Sitemap](https://cevolta.xyz/sitemap.xml)
- [llms.txt](https://cevolta.xyz/llms.txt)
- [About](https://cevolta.xyz/about)
- [Contact](https://cevolta.xyz/contact)
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug = [] } = await params;
  const segments = slug.length ? slug : ["index"];
  const isSafeSegment = (segment: string) => /^[a-zA-Z0-9_-]+$/.test(segment);

  let body: string;
  if (!segments.every(isSafeSegment)) {
    return new Response(NOT_FOUND_BODY, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  const contentPath = path.join(process.cwd(), "content", "markdown", ...segments) + ".md";

  try {
    body = await readFile(contentPath, "utf8");
  } catch {
    return new Response(NOT_FOUND_BODY, {
      status: 404,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        Vary: "Accept",
      },
    });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
      "Cache-Control": "s-maxage=60, stale-while-revalidate=86400",
    },
  });
}
