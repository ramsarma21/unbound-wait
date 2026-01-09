import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const isVercel =
  process.env.VERCEL ||
  process.env.VERCEL_ENV ||
  process.env.VERCEL_URL;
const DATA_DIR = isVercel
  ? path.join("/tmp", "waitlist-data")
  : path.join(process.cwd(), "data");
const WAITLIST_PATH = path.join(DATA_DIR, "waitlist.jsonl");

const ALLOWED_ORIGINS = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function corsHeaders(origin: string | null) {
  if (!origin || ALLOWED_ORIGINS.length === 0) {
    return undefined;
  }

  if (!ALLOWED_ORIGINS.includes(origin)) {
    return undefined;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}

async function sendNotification(email: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.WAITLIST_FROM_EMAIL;
  const to = process.env.WAITLIST_NOTIFY_EMAIL;

  if (!apiKey || !from || !to) {
    return;
  }

  const payload = {
    from,
    to: [to],
    subject: "New waitlist signup",
    text: `New waitlist signup: ${email}`
  };

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error: ${response.status} ${body}`);
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  return new NextResponse(null, { status: 204, headers });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  let payload: { email?: string } = {};
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload." },
      { status: 400, headers }
    );
  }

  const email = String(payload.email || "").trim();
  if (!emailPattern.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Invalid email." },
      { status: 400, headers }
    );
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const record = {
    email,
    createdAt: new Date().toISOString()
  };
  await fs.appendFile(WAITLIST_PATH, `${JSON.stringify(record)}\n`, "utf8");

  try {
    await sendNotification(email);
  } catch (error) {
    console.error("waitlist notification failed", error);
  }

  return NextResponse.json({ ok: true }, { status: 201, headers });
}
