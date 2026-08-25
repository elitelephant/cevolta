import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import {
  EMAIL_PATTERN,
  WAITLIST_PATHNAME,
  readEntries,
} from "@/lib/waitlist";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 400 }
      );
    }

    const entries = await readEntries();

    if (entries.some((entry) => entry.email === email)) {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }

    entries.push({ email, joinedAt: new Date().toISOString() });

    await put(WAITLIST_PATHNAME, JSON.stringify(entries, null, 2), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("waitlist error", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (
    !process.env.WAITLIST_ADMIN_KEY ||
    adminKey !== process.env.WAITLIST_ADMIN_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const entries = await readEntries();
  return NextResponse.json({ count: entries.length, entries });
}
