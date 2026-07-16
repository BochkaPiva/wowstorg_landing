import { Archive, BriefcaseBusiness, CalendarDays, Check, Download, Inbox, ListFilter, LoaderCircle, Mail, Phone, RefreshCcw, Search, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LandingLead, LandingLeadCatalogItem, LandingLeadStatus } from "@entities/admin/model";
import { requireSupabase } from "@shared/api/supabase";

type LeadRow = { id: string; status: LandingLeadStatus; source: "landing" | "manual"; name: string; company: string | null; contact_type: string; contact: string; event_type: string | null; guest_range: string | null; event_date: string | null; date_is_flexible: boolean; message: string | null; catalog_selection_ids: string[]; catalog_selection: unknown; created_at: string; converted_project_id: string | null };
type LeadView = "new" | "active" | "archive" | "all";

const statusLabels: Record<LandingLeadStatus, string> = {
  new: "Новая",
  contacted: "Связались",
  qualified: "Квалифицирована",
  rejected: "Отклонена",
  converted: "Передана в проект",
};

const viewLabels: Array<{ id: LeadView; label: string; icon: typeof Inbox }> = [
  { id: "new", label: "Новые", icon: Inbox },
  { id: "active", label: "В работе", icon: BriefcaseBusiness },
  { id: "archive", label: "Архив", icon: Archive },
  { id: "all", label: "Все", icon: ListFilter },
];

function parseCatalogSelection(value: unknown, legacyIds: string[]): LandingLeadCatalogItem[] {
  if (Array.isArray(value)) {
    const selection = value.filter((item): item is LandingLeadCatalogItem => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.id === "string"
        && typeof candidate.title === "string"
        && typeof candidate.section === "string"
        && typeof candidate.quantity === "number"
        && Number.isSafeInteger(candidate.quantity)
        && candidate.quantity > 0;
    });
    if (selection.length) return selection;
  }
  const quantities = new Map<string, number>();
  for (const id of legacyIds) quantities.set(id, (quantities.get(id) ?? 0) + 1);
  return Array.from(quantities, ([id, quantity]) => ({ id, title: id, section: "Каталог", quantity }));
}

const mapLead = (row: LeadRow): LandingLead => ({ id: row.id, status: row.status, source: row.source, name: row.name, company: row.company ?? undefined, contactType: row.contact_type, contact: row.contact, eventType: row.event_type ?? undefined, guestRange: row.guest_range ?? undefined, eventDate: row.event_date ?? undefined, dateIsFlexible: row.date_is_flexible, message: row.message ?? undefined, catalogSelectionIds: row.catalog_selection_ids, catalogSelection: parseCatalogSelection(row.catalog_selection, row.catalog_selection_ids), createdAt: row.created_at, convertedProjectId: row.converted_project_id ?? undefined });

const selectionTotal = (lead: LandingLead) => lead.catalogSelection.reduce((sum, item) => sum + item.quantity, 0);
const isArchived = (status: LandingLeadStatus) => status === "rejected" || status === "converted";
const isActive = (status: LandingLeadStatus) => status === "contacted" || status === "qualified";
const matchesView = (lead: LandingLead, view: LeadView) => view === "all" || (view === "new" ? lead.status === "new" : view === "active" ? isActive(lead.status) : isArchived(lead.status));
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function exportLeads(leads: LandingLead[], suffix: string) {
  const header = ["ID", "Создана", "Статус", "Имя", "Компания", "Способ связи", "Контакт", "Событие", "Гости", "Дата события", "Гибкая дата", "Комментарий", "Подборка", "Количество позиций", "Источник"];
  const rows = leads.map((lead) => [
    lead.id,
    new Date(lead.createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Omsk" }),
    statusLabels[lead.status],
    lead.name,
    lead.company ?? "",
    lead.contactType ?? "",
    lead.contact,
    lead.eventType ?? "",
    lead.guestRange ?? "",
    lead.eventDate ?? "",
    lead.dateIsFlexible ? "Да" : "Нет",
    lead.message ?? "",
    lead.catalogSelection.map((item) => `${item.title} — ${item.quantity} шт. (${item.section})`).join(" | "),
    selectionTotal(lead),
    lead.source,
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `wowstorg-zayavki-${suffix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function LeadsManager() {
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [view, setView] = useState<LeadView>("new");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await requireSupabase().from("landing_leads").select("*").order("created_at", { ascending: false });
    if (queryError) setError(queryError.message);
    else setLeads(((data ?? []) as LeadRow[]).map(mapLead));
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const counts = useMemo(() => ({
    new: leads.filter((lead) => lead.status === "new").length,
    active: leads.filter((lead) => isActive(lead.status)).length,
    archive: leads.filter((lead) => isArchived(lead.status)).length,
    all: leads.length,
  }), [leads]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return leads.filter((lead) => matchesView(lead, view) && (!needle || `${lead.name} ${lead.company ?? ""} ${lead.contact} ${lead.eventType ?? ""}`.toLocaleLowerCase("ru").includes(needle)));
  }, [leads, query, view]);

  const updateStatus = async (lead: LandingLead, nextStatus: LandingLeadStatus) => {
    setUpdatingId(lead.id);
    setError(null);
    const { error: updateError } = await requireSupabase().from("landing_leads").update({ status: nextStatus }).eq("id", lead.id);
    if (updateError) setError(updateError.message);
    else setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: nextStatus } : item));
    setUpdatingId(null);
  };

  const emptyCopy = view === "new"
    ? ["Новых обращений нет", "Все свежие заявки уже разобраны."]
    : view === "active"
      ? ["Нет заявок в работе", "Переведите новую заявку в статус «Связались» или «Квалифицирована»."]
      : view === "archive"
        ? ["Архив пока пуст", "Здесь появятся отклонённые и переданные в проект заявки."]
        : ["Заявки не найдены", "Измените поисковый запрос."];

  return <section className="admin-leads">
    <header><div><h2>Заявки</h2><p>Новые обращения требуют ответа, активные остаются в работе, отклонённые и завершённые автоматически переходят в архив.</p></div><div><button className="is-secondary" type="button" disabled={!leads.length} onClick={() => exportLeads(leads, "vse")}><Download size={17} /> Выгрузить все</button><button type="button" onClick={() => void load()} disabled={loading}><RefreshCcw className={loading ? "is-spinning" : ""} size={17} /> Обновить</button></div></header>
    <div className="admin-leadToolbar">
      <div className="admin-leadViews" role="tablist" aria-label="Группы заявок">{viewLabels.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={view === id} className={view === id ? "is-active" : ""} onClick={() => setView(id)}><Icon size={16} /><span>{label}</span><strong>{counts[id]}</strong></button>)}</div>
      <label className="admin-leadSearch"><Search size={17} /><span className="sr-only">Поиск по заявкам</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Имя, контакт или событие" /></label>
      <button className="admin-leadExport" type="button" disabled={!visible.length} onClick={() => exportLeads(visible, view)}><Download size={16} /> Выборку CSV</button>
    </div>
    {error ? <p className="admin-formError" role="alert">{error}</p> : null}
    {loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем заявки</div> : null}
    {!loading && !visible.length ? <div className="admin-listState"><Check size={24} /><strong>{emptyCopy[0]}</strong><span>{query ? "По вашему запросу ничего не найдено." : emptyCopy[1]}</span></div> : null}
    <div className="admin-leadList">{visible.map((lead) => {
      const isEmail = lead.contactType?.toLocaleLowerCase("ru").includes("поч") || lead.contact.includes("@");
      return <article className={lead.status === "new" ? "is-new" : isArchived(lead.status) ? "is-archived" : "is-active"} key={lead.id}>
        <header><div><div className="admin-leadHeading"><span className={`admin-leadStatus admin-leadStatus--${lead.status}`}>{statusLabels[lead.status]}</span><time dateTime={lead.createdAt}>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Omsk" }).format(new Date(lead.createdAt))}</time></div><h3>{lead.name}{lead.company ? ` · ${lead.company}` : ""}</h3></div><select aria-label={`Статус заявки ${lead.name}`} value={lead.status} disabled={updatingId === lead.id} onChange={(event) => void updateStatus(lead, event.target.value as LandingLeadStatus)}><option value="new">Новая</option><option value="contacted">Связались</option><option value="qualified">Квалифицирована</option><option value="rejected">Отклонена</option><option value="converted">Передана в проект</option></select></header>
        <div className="admin-leadFacts"><a href={`${isEmail ? "mailto:" : "tel:"}${lead.contact}`}>{isEmail ? <Mail size={16} /> : <Phone size={16} />}{lead.contact}</a><span><CalendarDays size={16} />{lead.eventDate ?? (lead.dateIsFlexible ? "Дата уточняется" : "Дата не указана")}</span><span><ShoppingBag size={16} />{lead.catalogSelection.length ? `${selectionTotal(lead)} ед. · ${lead.catalogSelection.length} наим.` : "Без подборки"}</span></div>
        <dl><div><dt>Событие</dt><dd>{lead.eventType ?? "Не указано"}</dd></div><div><dt>Гости</dt><dd>{lead.guestRange ?? "Не указано"}</dd></div>{lead.message ? <div><dt>Комментарий</dt><dd>{lead.message}</dd></div> : null}{lead.catalogSelection.length ? <div className="admin-leadSelection"><dt>Подборка</dt><dd><ul>{lead.catalogSelection.map((item) => <li key={item.id}><span>{item.title}<small>{item.section}</small></span><strong>{item.quantity} шт.</strong></li>)}</ul></dd></div> : null}</dl>
      </article>;
    })}</div>
  </section>;
}
