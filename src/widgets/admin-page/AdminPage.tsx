import { ArrowUpRight, Boxes, BriefcaseBusiness, CircleDot, ExternalLink, FileStack, Inbox, LayoutDashboard, Link2, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminWorkspaceSection } from "@entities/admin/model";
import { AdminAuthGate } from "@features/admin-auth/AdminAuthGate";
import { AdminAuthProvider, useAdminAuth } from "@features/admin-auth/AdminAuthContext";
import { requireSupabase } from "@shared/api/supabase";
import { CatalogManager } from "./CatalogManager";
import { LeadsManager } from "./LeadsManager";
import { PagesEditor } from "./PagesEditor";
import { PortfolioManager } from "./PortfolioManager";
import "./admin.css";

const navigation: Array<{ id: AdminWorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "pages", label: "Главная", icon: FileStack },
  { id: "catalog", label: "Каталог", icon: Boxes },
  { id: "cases", label: "Кейсы", icon: BriefcaseBusiness },
  { id: "leads", label: "Заявки", icon: Inbox },
  { id: "integration", label: "Интеграция", icon: Link2 },
];

const sectionTitles: Record<AdminWorkspaceSection, { title: string; description: string }> = {
  overview: { title: "Обзор", description: "Состояние контента, каталога и входящих обращений." },
  pages: { title: "Главная страница", description: "Черновик, предпросмотр и публикация блоков лендинга." },
  catalog: { title: "Каталог", description: "Пакетные предложения, игровые зоны и отдельный реквизит." },
  cases: { title: "Портфолио", description: "Только реальные проекты и согласованные фотографии." },
  leads: { title: "Заявки", description: "Очередь обращений с сайта и приложенные подборки." },
  integration: { title: "Граница систем", description: "Что остаётся на сайте, а что принадлежит внутренней WebApp." },
};

type Metrics = { catalog: number; published: number; cases: number; leads: number };

function Overview({ onNavigate }: { onNavigate: (section: AdminWorkspaceSection) => void }) {
  const [metrics, setMetrics] = useState<Metrics>({ catalog: 0, published: 0, cases: 0, leads: 0 });
  useEffect(() => {
    const client = requireSupabase();
    Promise.all([
      client.from("catalog_items").select("id", { count: "exact", head: true }),
      client.from("catalog_items").select("id", { count: "exact", head: true }).eq("status", "published"),
      client.from("portfolio_projects").select("id", { count: "exact", head: true }),
      client.from("landing_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]).then(([catalog, published, cases, leads]) => setMetrics({ catalog: catalog.count ?? 0, published: published.count ?? 0, cases: cases.count ?? 0, leads: leads.count ?? 0 }));
  }, []);

  return <div className="admin-overview">
    <section className="admin-primaryPanel"><div><span className="admin-kicker"><ShieldCheck size={15} /> Production CMS</span><h2>Сайт управляется через защищённый контур Supabase.</h2><p>Черновики отделены от публикации, загрузка файлов закрыта MFA и RLS, а каждое обращение проходит через защищённую Edge Function.</p></div><button type="button" onClick={() => onNavigate("pages")}>Открыть редактор <ArrowUpRight size={17} /></button></section>
    <section className="admin-metrics" aria-label="Сводка"><button type="button" onClick={() => onNavigate("catalog")}><span>Карточек каталога</span><strong>{metrics.catalog}</strong><small>{metrics.published} опубликовано</small></button><button type="button" onClick={() => onNavigate("cases")}><span>Кейсов</span><strong>{metrics.cases}</strong><small>портфолио</small></button><button type="button" onClick={() => onNavigate("leads")}><span>Новых заявок</span><strong>{metrics.leads}</strong><small>требуют ответа</small></button></section>
    <section className="admin-section admin-contentStatus"><header><div><h2>Рабочий порядок</h2><p>Изменения не попадают на сайт случайно.</p></div></header><div className="admin-contentRows"><div><strong>1. Черновик</strong><span>Редактируйте текст и проверяйте обязательные поля.</span><small>Безопасно</small></div><div><strong>2. Медиа</strong><span>Загружайте изображения файлами в Storage, добавляя понятный alt-текст.</span><small>До 10 МБ</small></div><div><strong>3. Публикация</strong><span>Опубликуйте готовую версию отдельным действием.</span><small>MFA</small></div></div></section>
  </div>;
}

function IntegrationWorkspace() {
  return <div className="admin-integration"><section className="admin-boundary"><div><span>Публичный контур</span><h2>Landing + CMS</h2><ul><li>контент и SEO</li><li>каталог и медиа</li><li>кейсы</li><li>первичные заявки</li></ul></div><div className="admin-boundaryLink"><Link2 size={22} /><strong>Явная передача</strong><small>по действию менеджера</small></div><div><span>Операционный контур</span><h2>WebApp_WowStorg</h2><ul><li>остатки и резервы</li><li>сметы и проекты</li><li>внутренние цены</li><li>складские процессы</li></ul></div></section><section className="admin-section admin-integrationRules"><header><div><h2>Принятые границы</h2><p>Сайты остаются раздельными и обмениваются только необходимыми данными.</p></div></header><div><strong>Публичный каталог</strong><span>Самостоятельные описания, фотографии и составы предложений.</span><small>На лендинге</small></div><div><strong>Складская доступность</strong><span>Позже проверяется серверным запросом по внешнему ID без раскрытия остатков.</span><small>Через API</small></div><div><strong>Заявки</strong><span>Остаются в CMS до решения менеджера создать рабочий проект.</span><small>Раздельно</small></div><div><strong>Авторизация</strong><span>Отдельные пользователи, обязательный TOTP и роли owner/admin/editor/viewer.</span><small>Изолировано</small></div></section></div>;
}

function AdminWorkspace() {
  const [activeSection, setActiveSection] = useState<AdminWorkspaceSection>("overview");
  const { profile, user, signOut } = useAdminAuth();
  const title = sectionTitles[activeSection];
  return <main className="admin-shell"><aside className="admin-sidebar"><a className="admin-brand" href="/"><span>ВАУСТОРГ</span><small>Управление сайтом</small></a><nav aria-label="Разделы админ-панели">{navigation.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeSection === item.id ? "is-active" : ""} type="button" onClick={() => setActiveSection(item.id)}><Icon size={18} /><span>{item.label}</span></button>; })}</nav><div className="admin-user"><CircleDot size={14} /><div><strong>{profile?.display_name || user?.email}</strong><span>{profile?.role}</span></div><button type="button" onClick={() => void signOut()} aria-label="Выйти"><LogOut size={17} /></button></div></aside><div className="admin-workspace"><header className="admin-topbar"><div><h1>{title.title}</h1><p>{title.description}</p></div><a href="/" target="_blank" rel="noreferrer">Открыть сайт <ExternalLink size={16} /></a></header><div className="admin-content">{activeSection === "overview" ? <Overview onNavigate={setActiveSection} /> : null}{activeSection === "pages" ? <PagesEditor /> : null}{activeSection === "catalog" ? <CatalogManager /> : null}{activeSection === "cases" ? <PortfolioManager /> : null}{activeSection === "leads" ? <LeadsManager /> : null}{activeSection === "integration" ? <IntegrationWorkspace /> : null}</div></div></main>;
}

export function AdminPage() {
  return <AdminAuthProvider><AdminAuthGate><AdminWorkspace /></AdminAuthGate></AdminAuthProvider>;
}
