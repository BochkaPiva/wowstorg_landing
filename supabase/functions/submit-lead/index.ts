import { createClient } from "@supabase/supabase-js";

type LeadPayload = {
  eventType?: unknown;
  guestRange?: unknown;
  dateMode?: unknown;
  eventDate?: unknown;
  name?: unknown;
  company?: unknown;
  contactType?: unknown;
  contact?: unknown;
  message?: unknown;
  catalogSelectionIds?: unknown;
  consentVersion?: unknown;
  turnstileToken?: unknown;
};

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

const jsonHeaders = { "Content-Type": "application/json; charset=utf-8" };
const productionOrigins = ["https://wowstorg.ru", "https://www.wowstorg.ru"];

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function supabaseAdminKey(): string {
  const keySet = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (keySet) {
    const keys = JSON.parse(keySet) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

function allowedOrigins(): Set<string> {
  const configuredOrigins = Deno.env.get("ALLOWED_ORIGINS")
    ?.split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean) ?? [];

  return new Set([...productionOrigins, ...configuredOrigins]);
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function response(origin: string, status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status, headers: { ...jsonHeaders, ...corsHeaders(origin) } });
}

function text(value: unknown, maxLength: number, required = false): string {
  if (typeof value !== "string") {
    if (required) throw new Error("invalid_payload");
    return "";
  }
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maxLength) throw new Error("invalid_payload");
  return normalized;
}

function getClientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

async function hashFingerprint(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env("IP_HASH_SECRET")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyTurnstile(token: string, ip: string, expectedHostname: string): Promise<boolean> {
  const form = new FormData();
  form.set("secret", env("TURNSTILE_SECRET_KEY"));
  form.set("response", token);
  if (ip !== "unknown") form.set("remoteip", ip);

  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(5000),
  });
  if (!result.ok) return false;

  const verification = await result.json() as TurnstileResult;
  return verification.success
    && verification.hostname === expectedHostname
    && (!verification.action || verification.action === "lead-form");
}

function parseDate(value: unknown, flexible: boolean): string | null {
  if (flexible) return null;
  const date = text(value, 10, true);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    throw new Error("invalid_payload");
  }
  return date;
}

Deno.serve(async (request) => {
  const origins = allowedOrigins();
  const origin = request.headers.get("origin")?.replace(/\/$/, "") ?? "";
  if (!origin || !origins.has(origin)) {
    return Response.json({ error: "origin_not_allowed" }, { status: 403, headers: jsonHeaders });
  }

  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== "POST") return response(origin, 405, { error: "method_not_allowed" });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24_000) return response(origin, 413, { error: "payload_too_large" });

  try {
    const rawPayload = await request.text();
    if (new TextEncoder().encode(rawPayload).byteLength > 24_000) {
      return response(origin, 413, { error: "payload_too_large" });
    }
    const payload = JSON.parse(rawPayload) as LeadPayload;
    const name = text(payload.name, 160, true);
    const company = text(payload.company, 200);
    const contactType = text(payload.contactType, 40, true);
    const contact = text(payload.contact, 320, true);
    const eventType = text(payload.eventType, 120, true);
    const guestRange = text(payload.guestRange, 80, true);
    const message = text(payload.message, 5000);
    const consentVersion = text(payload.consentVersion, 40, true);
    const turnstileToken = text(payload.turnstileToken, 2048, true);
    const dateIsFlexible = payload.dateMode === "flexible";
    if (payload.dateMode !== "flexible" && payload.dateMode !== "known") throw new Error("invalid_payload");
    const eventDate = parseDate(payload.eventDate, dateIsFlexible);
    const catalogSelectionIds = Array.isArray(payload.catalogSelectionIds)
      ? payload.catalogSelectionIds.map((item) => text(item, 160, true)).slice(0, 200)
      : [];

    const clientIp = getClientIp(request);
    const hostname = new URL(origin).hostname;
    if (!await verifyTurnstile(turnstileToken, clientIp, hostname)) {
      return response(origin, 400, { error: "verification_failed" });
    }

    const ipHash = await hashFingerprint(clientIp);
    const supabase = createClient(env("SUPABASE_URL"), supabaseAdminKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc("accept_landing_lead", {
      p_name: name,
      p_company: company,
      p_contact_type: contactType,
      p_contact: contact,
      p_event_type: eventType,
      p_guest_range: guestRange,
      p_event_date: eventDate,
      p_date_is_flexible: dateIsFlexible,
      p_message: message,
      p_catalog_selection_ids: catalogSelectionIds,
      p_consent_version: consentVersion,
      p_ip_hash: ipHash,
    });

    if (error) {
      if (error.message.includes("rate limit")) return response(origin, 429, { error: "too_many_requests" });
      console.error("Lead ingestion failed", { code: error.code });
      return response(origin, 500, { error: "submission_failed" });
    }

    return response(origin, 201, { id: data, status: "accepted" });
  } catch (error) {
    if (error instanceof SyntaxError || (error instanceof Error && error.message === "invalid_payload")) {
      return response(origin, 400, { error: "invalid_payload" });
    }
    console.error("Lead endpoint failed", { type: error instanceof Error ? error.name : "unknown" });
    return response(origin, 500, { error: "submission_failed" });
  }
});
