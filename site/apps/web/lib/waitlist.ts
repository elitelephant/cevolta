import { get } from "@vercel/blob";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const WAITLIST_PATHNAME = "waitlist.json";

export type WaitlistEntry = {
  email: string;
  joinedAt: string;
};

export async function readEntries(): Promise<WaitlistEntry[]> {
  const result = await get(WAITLIST_PATHNAME, { access: "private" });
  if (!result || result.statusCode !== 200) return [];
  try {
    const text = await new Response(result.stream).text();
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
