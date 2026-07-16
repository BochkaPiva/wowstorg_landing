import { CalendarDays, Check, LoaderCircle, Mail, Phone, RefreshCcw, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { LandingLead, LandingLeadCatalogItem, LandingLeadStatus } from "@entities/admin/model";
import { requireSupabase } from "@shared/api/supabase";

type LeadRow = { id: string; status: LandingLeadStatus; source: "landing" | "manual"; name: string; company: string | null; contact_type: string; contact: string; event_type: string | null; guest_range: string | null; event_date: string | null; date_is_flexible: boolean; message: string | null; catalog_selection_ids: string[]; catalog_selection: unknown; created_at: string; converted_project_id: string | null };

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

export function LeadsManager() {
  const [leads, setLeads] = useState<LandingLead[]>([]);
  const [status, setStatus] = useState<"all" | LandingLeadStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = async () => { setLoading(true); setError(null); const { data, error: queryError } = await requireSupabase().from("landing_leads").select("*").order("created_at", { ascending: false }); if (queryError) setError(queryError.message); else setLeads(((data ?? []) as LeadRow[]).map(mapLead)); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const visible = useMemo(() => status === "all" ? leads : leads.filter((lead) => lead.status === status), [leads, status]);
  const updateStatus = async (lead: LandingLead, nextStatus: LandingLeadStatus) => { const { error: updateError } = await requireSupabase().from("landing_leads").update({ status: nextStatus }).eq("id", lead.id); if (updateError) { setError(updateError.message); return; } setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: nextStatus } : item)); };

  return <section className="admin-leads"><header><div><h2>Входящие обращения</h2><p>Заявки хранятся отдельно от заказов реквизита. Подборка из каталога прикрепляется к обращению.</p></div><div><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="all">Все статусы</option><option value="new">Новые</option><option value="contacted">Связались</option><option value="qualified">Квалифицированы</option><option value="rejected">Отклонены</option><option value="converted">Переданы в проект</option></select><button type="button" onClick={() => void load()}><RefreshCcw size={17} /> Обновить</button></div></header>{error ? <p className="admin-formError">{error}</p> : null}{loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем заявки</div> : null}{!loading && !visible.length ? <div className="admin-listState"><Check size={24} /><strong>Новых обращений нет</strong><span>Здесь появится первая заявка с сайта.</span></div> : null}<div className="admin-leadList">{visible.map((lead) => <article key={lead.id}><header><div><span>{new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Omsk" }).format(new Date(lead.createdAt))}</span><h3>{lead.name}{lead.company ? ` · ${lead.company}` : ""}</h3></div><select aria-label={`Статус заявки ${lead.name}`} value={lead.status} onChange={(event) => void updateStatus(lead, event.target.value as LandingLeadStatus)}><option value="new">Новая</option><option value="contacted">Связались</option><option value="qualified">Квалифицирована</option><option value="rejected">Отклонена</option><option value="converted">Передана в проект</option></select></header><div className="admin-leadFacts"><span>{lead.contactType?.toLocaleLowerCase("ru").includes("поч") ? <Mail size={16} /> : <Phone size={16} />}{lead.contact}</span><span><CalendarDays size={16} />{lead.eventDate ?? (lead.dateIsFlexible ? "Дата уточняется" : "Дата не указана")}</span><span><ShoppingBag size={16} />{lead.catalogSelection.length ? `${selectionTotal(lead)} ед. · ${lead.catalogSelection.length} наим.` : "Без подборки"}</span></div><dl><div><dt>Событие</dt><dd>{lead.eventType ?? "Не указано"}</dd></div><div><dt>Гости</dt><dd>{lead.guestRange ?? "Не указано"}</dd></div>{lead.message ? <div><dt>Комментарий</dt><dd>{lead.message}</dd></div> : null}{lead.catalogSelection.length ? <div className="admin-leadSelection"><dt>Подборка</dt><dd><ul>{lead.catalogSelection.map((item) => <li key={item.id}><span>{item.title}<small>{item.section}</small></span><strong>{item.quantity} шт.</strong></li>)}</ul></dd></div> : null}</dl></article>)}</div></section>;
}
