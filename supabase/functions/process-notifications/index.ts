import { createClient } from "@supabase/supabase-js";

type ClaimedNotification = {
  outbox_id: string;
  lead_id: string;
  attempt: number;
};

type Lead = {
  id: string;
  name: string;
  company: string | null;
  contact_type: string;
  contact: string;
  event_type: string | null;
  guest_range: string | null;
  event_date: string | null;
  date_is_flexible: boolean;
  message: string | null;
  catalog_selection_ids: string[];
  catalog_selection: unknown;
  created_at: string;
};

type CatalogSelectionItem = {
  id: string;
  title: string;
  section: string;
  quantity: number;
};

function env(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalPositiveIntegerEnv(name: string): number | undefined {
  const value = Deno.env.get(name)?.trim();
  if (!value) return undefined;
  if (!/^\d+$/.test(value)) throw new Error(`Invalid positive integer environment variable: ${name}`);

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid positive integer environment variable: ${name}`);
  }
  return parsed;
}

function supabaseAdminKey(): string {
  const keySet = Deno.env.get("SUPABASE_SECRET_KEYS")?.trim();
  if (keySet) {
    const keys = JSON.parse(keySet) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  return env("SUPABASE_SERVICE_ROLE_KEY");
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1)}…`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseCatalogSelection(lead: Lead): CatalogSelectionItem[] {
  if (Array.isArray(lead.catalog_selection)) {
    const validItems = lead.catalog_selection.filter((item): item is CatalogSelectionItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === "string"
        && typeof candidate.title === "string"
        && typeof candidate.section === "string"
        && typeof candidate.quantity === "number"
        && Number.isSafeInteger(candidate.quantity)
        && candidate.quantity > 0;
    });
    if (validItems.length) return validItems;
  }

  const quantities = new Map<string, number>();
  for (const id of lead.catalog_selection_ids ?? []) quantities.set(id, (quantities.get(id) ?? 0) + 1);
  return Array.from(quantities, ([id, quantity]) => ({ id, title: id, section: "Каталог", quantity }));
}

function formatCatalogSelection(lead: Lead): string {
  const selection = parseCatalogSelection(lead);
  if (!selection.length) return "";

  const maxLength = 1400;
  const lines: string[] = [];
  let usedLength = 0;
  for (let index = 0; index < selection.length; index += 1) {
    const item = selection[index];
    const section = item.section ? ` <i>(${escapeHtml(item.section)})</i>` : "";
    const line = `• ${escapeHtml(item.title)} — <b>${item.quantity} шт.</b>${section}`;
    if (usedLength + line.length > maxLength) {
      lines.push(`…и ещё ${selection.length - index} поз.`);
      break;
    }
    lines.push(line);
    usedLength += line.length + 1;
  }
  return `\n\n<b>Подборка:</b>\n${lines.join("\n")}`;
}

function formatLead(lead: Lead): string {
  const date = lead.date_is_flexible || !lead.event_date
    ? "уточняется"
    : new Intl.DateTimeFormat("ru-RU", { timeZone: "Asia/Omsk" }).format(new Date(`${lead.event_date}T00:00:00+06:00`));
  const catalog = formatCatalogSelection(lead);
  const comment = lead.message ? `\n<b>Комментарий:</b> ${escapeHtml(truncate(lead.message, 1200))}` : "";

  return [
    "<b>Новая заявка с сайта</b>",
    "",
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Компания:</b> ${escapeHtml(lead.company || "не указана")}`,
    `<b>Контакт:</b> ${escapeHtml(lead.contact_type)} · ${escapeHtml(lead.contact)}`,
    `<b>Событие:</b> ${escapeHtml(lead.event_type || "не указано")}`,
    `<b>Гости:</b> ${escapeHtml(lead.guest_range || "не указано")}`,
    `<b>Дата:</b> ${date}${comment}${catalog}`,
    "",
    `<code>${escapeHtml(lead.id)}</code>`,
  ].join("\n");
}

async function sendTelegram(lead: Lead): Promise<void> {
  const payload: Record<string, string | number | boolean> = {
    chat_id: env("TELEGRAM_CHAT_ID"),
    text: formatLead(lead),
    parse_mode: "HTML",
    disable_notification: false,
  };
  const messageThreadId = optionalPositiveIntegerEnv("TELEGRAM_MESSAGE_THREAD_ID");
  if (messageThreadId) payload.message_thread_id = messageThreadId;

  const result = await fetch(`https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(8000),
  });

  const body = await result.json().catch(() => null) as { ok?: boolean; description?: string } | null;
  if (!result.ok || !body?.ok) throw new Error(body?.description || `Telegram HTTP ${result.status}`);
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return Response.json({ error: "method_not_allowed" }, { status: 405 });

  const suppliedSecret = request.headers.get("x-cron-secret") ?? "";
  const expectedSecret = Deno.env.get("CRON_SECRET") ?? "";
  if (!expectedSecret || suppliedSecret.length !== expectedSecret.length) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const suppliedBytes = new TextEncoder().encode(suppliedSecret);
  const expectedBytes = new TextEncoder().encode(expectedSecret);
  let difference = 0;
  for (let index = 0; index < expectedBytes.length; index += 1) difference |= suppliedBytes[index] ^ expectedBytes[index];
  if (difference !== 0) return Response.json({ error: "unauthorized" }, { status: 401 });

  try {
    const supabase = createClient(env("SUPABASE_URL"), supabaseAdminKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claimed, error: claimError } = await supabase.rpc("claim_telegram_notifications", { p_batch_size: 10 });
    if (claimError) throw claimError;

    const notifications = (claimed ?? []) as ClaimedNotification[];
    if (!notifications.length) return Response.json({ processed: 0, sent: 0, failed: 0 });

    const { data: leads, error: leadError } = await supabase
      .from("landing_leads")
      .select("id,name,company,contact_type,contact,event_type,guest_range,event_date,date_is_flexible,message,catalog_selection_ids,catalog_selection,created_at")
      .in("id", notifications.map((item) => item.lead_id));
    if (leadError) throw leadError;

    const leadById = new Map((leads as Lead[]).map((lead) => [lead.id, lead]));
    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      const lead = leadById.get(notification.lead_id);
      try {
        if (!lead) throw new Error("Lead not found");
        await sendTelegram(lead);
        const { error } = await supabase.from("notification_outbox").update({
          status: "sent",
          sent_at: new Date().toISOString(),
          locked_at: null,
          last_error: null,
        }).eq("id", notification.outbox_id);
        if (error) throw error;
        sent += 1;
      } catch (error) {
        failed += 1;
        const terminal = notification.attempt >= 8;
        const delayMs = Math.min(30 * 60_000, 30_000 * 2 ** Math.min(notification.attempt, 6));
        const safeError = error instanceof Error ? error.message.slice(0, 500) : "Unknown notification error";
        await supabase.from("notification_outbox").update({
          status: terminal ? "failed" : "pending",
          next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
          locked_at: null,
          last_error: safeError,
        }).eq("id", notification.outbox_id);
      }
    }

    return Response.json({ processed: notifications.length, sent, failed });
  } catch (error) {
    console.error("Notification processor failed", { type: error instanceof Error ? error.name : "unknown" });
    return Response.json({ error: "processor_failed" }, { status: 500 });
  }
});
