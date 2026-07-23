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
  catalogSelection?: unknown;
  catalogSelectionIds?: unknown;
  consentVersion?: unknown;
  turnstileToken?: unknown;
};

type CatalogSelectionInput = { id: string; quantity: number };
type CanonicalCatalogSelection = CatalogSelectionInput & { title: string; section: string };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function parseCatalogSelection(value: unknown, legacyIds: unknown): CatalogSelectionInput[] {
  const quantities = new Map<string, number>();

  if (Array.isArray(value)) {
    if (value.length > 100) throw new Error("invalid_payload");
    for (const entry of value) {
      if (!entry || typeof entry !== "object") throw new Error("invalid_payload");
      const candidate = entry as Record<string, unknown>;
      const id = text(candidate.id, 160, true);
      if (!uuidPattern.test(id)) throw new Error("invalid_payload");
      const quantity = candidate.quantity;
      if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 200) {
        throw new Error("invalid_payload");
      }
      quantities.set(id, (quantities.get(id) ?? 0) + quantity);
    }
  } else if (Array.isArray(legacyIds)) {
    for (const rawId of legacyIds.slice(0, 200)) {
      const id = text(rawId, 160, true);
      if (!uuidPattern.test(id)) throw new Error("invalid_payload");
      quantities.set(id, (quantities.get(id) ?? 0) + 1);
    }
  }

  const selection = Array.from(quantities, ([id, quantity]) => ({ id, quantity }));
  if (selection.length > 100 || selection.reduce((sum, item) => sum + item.quantity, 0) > 200) {
    throw new Error("invalid_payload");
  }
  return selection;
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
  form.set("idempotency_key", crypto.randomUUID());
  if (ip !== "unknown") form.set("remoteip", ip);

  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(5000),
  });
  if (!result.ok) {
    console.warn("Turnstile request failed", { status: result.status });
    return false;
  }

  const verification = await result.json() as TurnstileResult;
  const valid = verification.success
    && verification.hostname === expectedHostname
    && (!verification.action || verification.action === "lead-form");
  if (!valid) {
    console.warn("Turnstile verification rejected", {
      action: verification.action ?? null,
      errorCodes: verification["error-codes"] ?? [],
      expectedHostname,
      hostname: verification.hostname ?? null,
    });
  }
  return valid;
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
    const requestedCatalogSelection = parseCatalogSelection(payload.catalogSelection, payload.catalogSelectionIds);

    const clientIp = getClientIp(request);
    const hostname = new URL(origin).hostname;
    if (!await verifyTurnstile(turnstileToken, clientIp, hostname)) {
      return response(origin, 400, { error: "verification_failed" });
    }

    const ipHash = await hashFingerprint(clientIp);
    const supabase = createClient(env("SUPABASE_URL"), supabaseAdminKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    let catalogSelection: CanonicalCatalogSelection[] = [];
    if (requestedCatalogSelection.length) {
      const requestedIds = requestedCatalogSelection.map((item) => item.id);
      const { data: catalogItems, error: catalogError } = await supabase
        .from("catalog_items")
        .select("id,title,category_id,prop_group_id,stock_quantity")
        .in("id", requestedIds)
        .eq("status", "published");
      if (catalogError) throw catalogError;
      if ((catalogItems ?? []).length !== requestedIds.length) throw new Error("invalid_payload");

      const categoryIds = Array.from(new Set((catalogItems ?? []).map((item) => item.category_id)));
      const { data: categories, error: categoryError } = await supabase
        .from("catalog_categories")
        .select("id,title")
        .in("id", categoryIds);
      if (categoryError) throw categoryError;

      const itemById = new Map((catalogItems ?? []).map((item) => [item.id, item]));
      const categoryById = new Map((categories ?? []).map((category) => [category.id, category.title]));
      const propGroupIds = Array.from(new Set((catalogItems ?? []).map((item) => item.prop_group_id).filter(Boolean)));
      const { data: propGroups, error: propGroupError } = propGroupIds.length
        ? await supabase.from("catalog_prop_groups").select("id,title").in("id", propGroupIds)
        : { data: [], error: null };
      if (propGroupError) throw propGroupError;
      const propGroupById = new Map((propGroups ?? []).map((group) => [group.id, group.title]));
      catalogSelection = requestedCatalogSelection.map((requested) => {
        const catalogItem = itemById.get(requested.id);
        if (!catalogItem) throw new Error("invalid_payload");
        if (catalogItem.stock_quantity !== null && requested.quantity > catalogItem.stock_quantity) {
          throw new Error("invalid_payload");
        }
        return {
          id: catalogItem.id,
          title: catalogItem.title,
          section: catalogItem.prop_group_id
            ? propGroupById.get(catalogItem.prop_group_id) ?? categoryById.get(catalogItem.category_id) ?? "Каталог"
            : categoryById.get(catalogItem.category_id) ?? "Каталог",
          quantity: requested.quantity,
        };
      });
    }
    const catalogSelectionIds = catalogSelection.flatMap((item) => Array.from({ length: item.quantity }, () => item.id));
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
      p_catalog_selection: catalogSelection,
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
