const { put, get } = require("@vercel/blob");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WAITLIST_PATHNAME = "waitlist.json";

async function readEntries() {
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

async function handleSignup(req, res) {
  const { email } = req.body || {};
  const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }

  const entries = await readEntries();

  if (entries.some((entry) => entry.email === trimmedEmail)) {
    res.status(200).json({ ok: true, alreadyJoined: true });
    return;
  }

  entries.push({ email: trimmedEmail, joinedAt: new Date().toISOString() });

  await put(WAITLIST_PATHNAME, JSON.stringify(entries, null, 2), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  res.status(200).json({ ok: true });
}

async function handleAdminRead(req, res) {
  const adminKey = req.headers["x-admin-key"];
  if (!process.env.WAITLIST_ADMIN_KEY || adminKey !== process.env.WAITLIST_ADMIN_KEY) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const entries = await readEntries();
  res.status(200).json({ count: entries.length, entries });
}

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      await handleSignup(req, res);
      return;
    }
    if (req.method === "GET") {
      await handleAdminRead(req, res);
      return;
    }
    res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    console.error("waitlist error", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
