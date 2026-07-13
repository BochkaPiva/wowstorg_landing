import {
  ArrowUpRight,
  BookOpenText,
  Boxes,
  BriefcaseBusiness,
  Check,
  CircleDot,
  ExternalLink,
  FileStack,
  Inbox,
  LayoutDashboard,
  Link2,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import type { AdminWorkspaceSection } from "@entities/admin/model";
import { PagesEditor } from "./PagesEditor";
import "./admin.css";

const navigation: Array<{ id: AdminWorkspaceSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Обзор", icon: LayoutDashboard },
  { id: "pages", label: "Страницы", icon: FileStack },
  { id: "catalog", label: "Каталог", icon: Boxes },
  { id: "cases", label: "Кейсы", icon: BriefcaseBusiness },
  { id: "leads", label: "Заявки", icon: Inbox },
  { id: "integration", label: "Интеграция", icon: Link2 },
];

const sectionTitles: Record<AdminWorkspaceSection, { title: string; description: string }> = {
  overview: { title: "Обзор", description: "Состояние сайта, контента и внешних связей." },
  pages: { title: "Главная страница", description: "Редактирование содержания внутри утверждённой композиции." },
  catalog: { title: "Каталог", description: "Публичные пакеты, зоны и связанные позиции реквизита." },
  cases: { title: "Кейсы", description: "Портфолио по направлениям и материалы реализованных проектов." },
  leads: { title: "Заявки с сайта", description: "Отдельная очередь первичных обращений клиентов." },
  integration: { title: "Связь с WebApp", description: "Контролируемая граница между публичным сайтом и внутренней системой." },
};

const contentRows = [
  { name: "SEO и Hero", detail: "Сниппет, позиционирование, видео и основной CTA", status: "Готов" },
  { name: "Форматы и каталог", detail: "Направления работы и витрина предложений", status: "Готов" },
  { name: "Кейсы", detail: "Направления, проекты, факты и галереи", status: "Редактор готов" },
  { name: "История и FAQ", detail: "Пять сцен и работа с возражениями", status: "Готов" },
  { name: "Заявка и футер", detail: "Короткий бриф, контакты и финальный экран", status: "Готов" },
];

function Overview({ onNavigate }: { onNavigate: (section: AdminWorkspaceSection) => void }) {
  return (
    <div className="admin-overview">
      <section className="admin-primaryPanel">
        <div>
          <span className="admin-kicker"><CircleDot size={14} /> Локальный контур</span>
          <h2>Контент отделён от внутренней операционной системы.</h2>
          <p>Сайт собирает лиды и показывает публичный каталог. Остатки, резервы и рабочие проекты остаются в WebApp_WowStorg.</p>
        </div>
        <button type="button" onClick={() => onNavigate("integration")}>Посмотреть границу систем <ArrowUpRight size={17} /></button>
      </section>

      <section className="admin-section admin-contentStatus">
        <header><div><h2>Главная страница</h2><p>Все активные контентные зоны доступны в одном версионируемом черновике.</p></div><button type="button" onClick={() => onNavigate("pages")}>Редактировать</button></header>
        <div className="admin-contentRows">
          {contentRows.map((row) => <div key={row.name}><strong>{row.name}</strong><span>{row.detail}</span><small className="is-ready">{row.status}</small></div>)}
        </div>
      </section>

      <div className="admin-splitPanels">
        <section className="admin-section admin-metricPanel"><span>Заявки</span><strong>0</strong><p>Публичная форма не будет писать в базу напрямую. Приём обращений подключим через защищённый серверный endpoint.</p><button type="button" onClick={() => onNavigate("leads")}>Открыть очередь</button></section>
        <section className="admin-section admin-metricPanel"><span>Публикации</span><strong>0</strong><p>Production-публикация появится после подключения Auth, MFA, RLS и журнала изменений.</p><button type="button" onClick={() => onNavigate("pages")}>Открыть редактор</button></section>
      </div>
    </div>
  );
}

function EmptyWorkspace({ kind }: { kind: "catalog" | "cases" }) {
  const isCatalog = kind === "catalog";
  return (
    <section className="admin-emptyWorkspace">
      <div className="admin-emptyIcon">{isCatalog ? <Boxes size={24} /> : <BookOpenText size={24} />}</div>
      <h2>{isCatalog ? "Сначала модель, затем позиции." : "Портфолио уже редактируется в контенте страницы."}</h2>
      <p>{isCatalog ? "Здесь появятся публичные карточки пакетов, зон и реквизита. Складские позиции будут подключаться по внешнему ID и не станут автоматически публичными." : "Направления, проекты, факты и галереи доступны в разделе «Страницы → Кейсы». Отдельный workspace появится, когда портфолио получит загрузку файлов и статусы публикации."}</p>
      <div className="admin-nextSteps">
        <span><Check size={15} /> Типизированная структура определена</span>
        <span><CircleDot size={15} /> API и хранилище подключаются отдельно</span>
      </div>
    </section>
  );
}

function LeadsWorkspace() {
  return (
    <section className="admin-leadsWorkspace">
      <div className="admin-leadFlow">
        {[
          ["01", "Новая заявка", "Первичное обращение с сайта"],
          ["02", "Квалификация", "Менеджер уточняет задачу"],
          ["03", "Создать проект", "Явная передача в WebApp"],
        ].map(([number, title, text]) => <div key={number}><span>{number}</span><strong>{title}</strong><p>{text}</p></div>)}
      </div>
      <div className="admin-leadsEmpty"><Inbox size={26} /><h2>Очередь пока пуста</h2><p>Лиды не смешиваются с заказами реквизита. После подключения backend здесь появятся контакты, параметры события и подборка из каталога.</p></div>
    </section>
  );
}

function IntegrationWorkspace() {
  return (
    <div className="admin-integration">
      <section className="admin-boundary">
        <div><span>Публичный контур</span><h2>Landing + Admin</h2><ul><li>контент и SEO</li><li>пакетные предложения</li><li>кейсы и медиа</li><li>входящие лиды</li></ul></div>
        <div className="admin-boundaryLink"><Link2 size={22} /><strong>Контракт API</strong><small>только разрешённые поля</small></div>
        <div><span>Операционный контур</span><h2>WebApp_WowStorg</h2><ul><li>остатки и резервы</li><li>внутренние цены</li><li>сметы и проекты</li><li>складские процессы</li></ul></div>
      </section>
      <section className="admin-section admin-integrationRules">
        <header><div><h2>Что связываем</h2><p>Интеграция включается только там, где у систем есть общий предмет.</p></div></header>
        <div><strong>Каталог</strong><span>Публичная карточка может ссылаться на одну или несколько складских позиций через стабильные ID.</span><small>Да</small></div>
        <div><strong>Доступность</strong><span>Проверяется по датам отдельным серверным запросом без раскрытия внутренних остатков.</span><small>Позже</small></div>
        <div><strong>Лиды</strong><span>Остаются в админке сайта, пока менеджер явно не создаст из лида рабочий проект.</span><small>Раздельно</small></div>
        <div><strong>Пользователи</strong><span>Администраторы сайта и сотрудники WebApp имеют разные роли и сессии.</span><small>Раздельно</small></div>
      </section>
    </div>
  );
}

export function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminWorkspaceSection>("overview");
  const title = sectionTitles[activeSection];

  if (!import.meta.env.DEV) {
    return <main className="admin-unavailable"><Settings2 size={28} /><h1>Админ-панель закрыта</h1><p>Production-доступ включится только после настройки серверной авторизации, MFA, RLS-политик и журнала изменений.</p><a href="/">Вернуться на сайт</a></main>;
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/"><span>ВАУСТОРГ</span><small>Управление сайтом</small></a>
        <nav aria-label="Разделы админ-панели">
          {navigation.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={activeSection === item.id ? "is-active" : ""} type="button" onClick={() => setActiveSection(item.id)}><Icon size={18} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="admin-localBadge"><CircleDot size={14} /><div><strong>Локальный draft</strong><span>Production закрыт</span></div></div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div><h1>{title.title}</h1><p>{title.description}</p></div>
          <a href="/" target="_blank" rel="noreferrer">Открыть сайт <ExternalLink size={16} /></a>
        </header>
        <div className="admin-content">
          {activeSection === "overview" ? <Overview onNavigate={setActiveSection} /> : null}
          {activeSection === "pages" ? <PagesEditor /> : null}
          {activeSection === "catalog" ? <EmptyWorkspace kind="catalog" /> : null}
          {activeSection === "cases" ? <EmptyWorkspace kind="cases" /> : null}
          {activeSection === "leads" ? <LeadsWorkspace /> : null}
          {activeSection === "integration" ? <IntegrationWorkspace /> : null}
        </div>
      </div>
    </main>
  );
}
