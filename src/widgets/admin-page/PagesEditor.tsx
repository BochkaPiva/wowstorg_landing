import { Check, ExternalLink, LoaderCircle, Plus, RefreshCcw, Rocket, Save, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import type { LandingContentDraft } from "@entities/admin/model";
import {
  loadLocalDraft,
  saveLocalDraft,
} from "@features/admin-content/localDraftRepository";
import { loadLandingDocument, publishLandingDocument, saveLandingDocument, type ContentDocument } from "@features/admin-content/supabaseContentRepository";
import { useAdminAuth } from "@features/admin-auth/AdminAuthContext";
import { getPublicMediaUrl, uploadSiteImage } from "@shared/api/supabase";
import { MediaUploader } from "./MediaUploader";

type BlockId =
  | "seo"
  | "hero"
  | "trust"
  | "formats"
  | "catalog"
  | "cases"
  | "story"
  | "faq"
  | "lead"
  | "legal"
  | "footer";

const blocks: Array<{ id: BlockId; title: string; caption: string }> = [
  { id: "seo", title: "SEO", caption: "Поиск и сниппет" },
  { id: "hero", title: "Hero", caption: "Первый экран" },
  { id: "trust", title: "Строка направлений", caption: "Бегущая строка" },
  { id: "formats", title: "Форматы", caption: "Основные услуги" },
  { id: "catalog", title: "Каталог", caption: "Витрина разделов" },
  { id: "cases", title: "Портфолио", caption: "Заголовок кейсов" },
  { id: "story", title: "История с дино", caption: "Пять сцен" },
  { id: "faq", title: "FAQ", caption: "Вопросы и ответы" },
  { id: "lead", title: "Заявка", caption: "Бриф и контакты" },
  { id: "legal", title: "Документы", caption: "Политика и согласия" },
  { id: "footer", title: "Футер", caption: "Финальный экран" },
];

const blockDescriptions: Record<BlockId, string> = {
  seo: "Заголовок и описание страницы для поисковых систем. Техническая разметка остаётся в коде.",
  hero: "Текст и видео первого экрана. Композиция, навигация и анимация защищены кодом.",
  trust: "Короткие направления, которые непрерывно движутся под первым экраном.",
  formats: "Главные услуги и ссылка на самостоятельный каталог.",
  catalog: "Редакционная витрина разделов каталога. Карточки товаров редактируются отдельно.",
  cases: "Заголовок портфолио на лендинге. Сами проекты и фотографии редактируются в разделе «Кейсы».",
  story: "Тексты пяти сцен синхронизированы с пятью видео и не могут менять их порядок.",
  faq: "Ответы на частые вопросы перед формой заявки.",
  lead: "Текст короткого брифа, варианты выбора и публичные контакты.",
  legal: "Тексты открываются поверх сайта. Изменения публикуются вместе с остальным содержимым лендинга.",
  footer: "Финальное сообщение, география и прямые контакты.",
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function StringListEditor({ values, onChange, addLabel = "Добавить пункт" }: {
  values: string[];
  onChange: (values: string[]) => void;
  addLabel?: string;
}) {
  return (
    <div className="admin-repeater">
      {values.map((value, index) => (
        <div className="admin-repeaterRow" key={index}>
          <input value={value} aria-label={`Пункт ${index + 1}`} onChange={(event) => {
            const next = [...values];
            next[index] = event.target.value;
            onChange(next);
          }} />
          <button type="button" aria-label={`Удалить пункт ${index + 1}`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button className="admin-addButton" type="button" onClick={() => onChange([...values, "Новый пункт"])}>
        <Plus size={16} /> {addLabel}
      </button>
    </div>
  );
}

function ItemCard({ title, onRemove, children }: { title: string; onRemove?: () => void; children: ReactNode }) {
  return (
    <section className="admin-itemCard">
      <header>
        <strong>{title}</strong>
        {onRemove ? <button type="button" onClick={onRemove}><Trash2 size={15} /> Удалить</button> : null}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function PagesEditor() {
  const { user, profile } = useAdminAuth();
  const [draft, setDraft] = useState<LandingContentDraft>(() => loadLocalDraft());
  const [document, setDocument] = useState<ContentDocument | null>(null);
  const [activeBlock, setActiveBlock] = useState<BlockId>("hero");
  const [savedAt, setSavedAt] = useState(draft.updatedAt);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = profile?.role !== "viewer";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await loadLandingDocument();
      setDocument(next);
      setDraft(next.content);
      setSavedAt(next.updatedAt ?? "");
      setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить документ.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const mutate = (recipe: (next: LandingContentDraft) => void) => {
    setDraft((current) => {
      const next = structuredClone(current);
      recipe(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!user || !document || !canEdit) return;
    setSaving(true); setError(null); setMessage(null);
    try {
      const saved = await saveLandingDocument({ ...document, content: draft }, user.id);
      saveLocalDraft(saved.content);
      setDocument(saved);
      setDraft(saved.content);
      setSavedAt(saved.updatedAt ?? "");
      setDirty(false);
      setMessage("Черновик сохранён.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить документ."); }
    finally { setSaving(false); }
  };

  const publish = async () => {
    if (!document || dirty) return;
    setPublishing(true); setError(null); setMessage(null);
    try {
      const nextVersion = await publishLandingDocument(document);
      setDocument({ ...document, version: nextVersion });
      setMessage(`Версия ${nextVersion} опубликована на сайте.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось опубликовать документ."); }
    finally { setPublishing(false); }
  };

  const activeMeta = blocks.find((block) => block.id === activeBlock) ?? blocks[0];

  const renderEditor = () => {
    if (activeBlock === "seo") {
      return <div className="admin-formSection">
        <h3>Поисковый сниппет</h3>
        <Field label="Title" hint={`${draft.seo.title.length}/60 символов`}><input maxLength={70} value={draft.seo.title} onChange={(event) => mutate((next) => { next.seo.title = event.target.value; })} /></Field>
        <Field label="Description" hint={`${draft.seo.description.length}/160 символов`}><textarea rows={4} maxLength={180} value={draft.seo.description} onChange={(event) => mutate((next) => { next.seo.description = event.target.value; })} /></Field>
      </div>;
    }

    if (activeBlock === "hero") {
      return <div className="admin-formSection">
        <h3>Содержание первого экрана</h3>
        <Field label="Надзаголовок"><input value={draft.hero.eyebrow} onChange={(event) => mutate((next) => { next.hero.eyebrow = event.target.value; })} /></Field>
        <div className="admin-fieldPair">
          <Field label="Заголовок"><input value={draft.hero.title} onChange={(event) => mutate((next) => { next.hero.title = event.target.value; })} /></Field>
          <Field label="Акцентная строка"><input value={draft.hero.accent} onChange={(event) => mutate((next) => { next.hero.accent = event.target.value; })} /></Field>
        </div>
        <Field label="Описание" hint={`${draft.hero.description.length}/220 символов`}><textarea rows={4} maxLength={220} value={draft.hero.description} onChange={(event) => mutate((next) => { next.hero.description = event.target.value; })} /></Field>
        <div className="admin-fieldPair">
          <Field label="Текст кнопки"><input value={draft.hero.ctaLabel} onChange={(event) => mutate((next) => { next.hero.ctaLabel = event.target.value; })} /></Field>
          <Field label="Видео" hint="Путь внутри public"><input value={draft.hero.videoPath} onChange={(event) => mutate((next) => { next.hero.videoPath = event.target.value; })} /></Field>
        </div>
      </div>;
    }

    if (activeBlock === "trust") {
      return <div className="admin-formSection">
        <h3>Бегущая строка</h3>
        <Field label="Подпись"><input value={draft.trust.label} onChange={(event) => mutate((next) => { next.trust.label = event.target.value; })} /></Field>
        {draft.trust.items.map((item, index) => <ItemCard key={index} title={item.name || `Логотип ${index + 1}`} onRemove={() => mutate((next) => { next.trust.items.splice(index, 1); })}>
          <Field label="Название" hint="Используется как alt-текст и fallback"><input value={item.name} onChange={(event) => mutate((next) => { next.trust.items[index].name = event.target.value; })} /></Field>
          {item.imagePath ? <div className="admin-logoPreview"><img src={getPublicMediaUrl(item.imagePath)} alt={item.name} /><button type="button" onClick={() => mutate((next) => { next.trust.items[index].imagePath = ""; })}><Trash2 size={15} /> Убрать</button></div> : <MediaUploader multiple={false} label="Загрузить логотип" onUpload={async (file) => { const path = await uploadSiteImage("logos", file); mutate((next) => { next.trust.items[index].imagePath = path; }); }} />}
          <Field label="Ссылка" hint="Необязательно"><input type="url" value={item.href} placeholder="https://company.ru" onChange={(event) => mutate((next) => { next.trust.items[index].href = event.target.value; })} /></Field>
        </ItemCard>)}
        <button className="admin-addButton" type="button" onClick={() => mutate((next) => { next.trust.items.push({ name: "Новый клиент", imagePath: "", href: "" }); })}><Plus size={16} /> Добавить логотип</button>
      </div>;
    }

    if (activeBlock === "formats") {
      return <>
        <div className="admin-formSection">
          <h3>Заголовок блока</h3>
          <div className="admin-fieldPair">
            <Field label="Надзаголовок"><input value={draft.formats.eyebrow} onChange={(event) => mutate((next) => { next.formats.eyebrow = event.target.value; })} /></Field>
            <Field label="Заголовок"><input value={draft.formats.title} onChange={(event) => mutate((next) => { next.formats.title = event.target.value; })} /></Field>
          </div>
          <Field label="Краткое описание"><textarea rows={3} value={draft.formats.summary} onChange={(event) => mutate((next) => { next.formats.summary = event.target.value; })} /></Field>
        </div>
        <div className="admin-formSection">
          <h3>Форматы</h3>
          {draft.formats.items.map((item, index) => <ItemCard key={index} title={`0${index + 1} · ${item.title}`} onRemove={() => mutate((next) => { next.formats.items.splice(index, 1); })}>
            <Field label="Название"><input value={item.title} onChange={(event) => mutate((next) => { next.formats.items[index].title = event.target.value; })} /></Field>
            <Field label="Описание"><textarea rows={2} value={item.text} onChange={(event) => mutate((next) => { next.formats.items[index].text = event.target.value; })} /></Field>
          </ItemCard>)}
          <button className="admin-addButton" type="button" onClick={() => mutate((next) => { next.formats.items.push({ title: "Новый формат", text: "Описание формата", note: "" }); })}><Plus size={16} /> Добавить формат</button>
        </div>
        <div className="admin-formSection">
          <h3>Переход в каталог</h3>
          <Field label="Пояснение"><textarea rows={3} value={draft.formats.catalogNote} onChange={(event) => mutate((next) => { next.formats.catalogNote = event.target.value; })} /></Field>
          <Field label="Текст кнопки"><input value={draft.formats.catalogCtaLabel} onChange={(event) => mutate((next) => { next.formats.catalogCtaLabel = event.target.value; })} /></Field>
        </div>
      </>;
    }

    if (activeBlock === "catalog") {
      return <>
        <div className="admin-formSection">
          <h3>Заголовок витрины</h3>
          <Field label="Надзаголовок"><input value={draft.catalogGateway.eyebrow} onChange={(event) => mutate((next) => { next.catalogGateway.eyebrow = event.target.value; })} /></Field>
          <div className="admin-fieldPair">
            <Field label="Заголовок"><input value={draft.catalogGateway.title} onChange={(event) => mutate((next) => { next.catalogGateway.title = event.target.value; })} /></Field>
            <Field label="Акцент"><input value={draft.catalogGateway.accent} onChange={(event) => mutate((next) => { next.catalogGateway.accent = event.target.value; })} /></Field>
          </div>
          <Field label="Описание"><textarea rows={3} value={draft.catalogGateway.description} onChange={(event) => mutate((next) => { next.catalogGateway.description = event.target.value; })} /></Field>
          <Field label="Текст кнопки"><input value={draft.catalogGateway.ctaLabel} onChange={(event) => mutate((next) => { next.catalogGateway.ctaLabel = event.target.value; })} /></Field>
        </div>
        <div className="admin-formSection">
          <h3>Разделы каталога</h3>
          {draft.catalogGateway.sections.map((item, index) => <ItemCard key={index} title={`${item.index} · ${item.tab}`} onRemove={() => mutate((next) => { next.catalogGateway.sections.splice(index, 1); })}>
            <div className="admin-fieldPair">
              <Field label="ID в URL"><input value={item.id} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].id = event.target.value.replace(/[^a-z0-9-]/gi, "").toLowerCase(); })} /></Field>
              <Field label="Номер"><input value={item.index} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].index = event.target.value; })} /></Field>
            </div>
            <div className="admin-fieldPair">
              <Field label="Название вкладки"><input value={item.tab} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].tab = event.target.value; })} /></Field>
              <Field label="Заголовок"><input value={item.title} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].title = event.target.value; })} /></Field>
            </div>
            <Field label="Короткий тезис"><input value={item.subtitle} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].subtitle = event.target.value; })} /></Field>
            <Field label="Описание"><textarea rows={3} value={item.description} onChange={(event) => mutate((next) => { next.catalogGateway.sections[index].description = event.target.value; })} /></Field>
          </ItemCard>)}
          <button className="admin-addButton" type="button" onClick={() => mutate((next) => { const number = String(next.catalogGateway.sections.length + 1).padStart(2, "0"); next.catalogGateway.sections.push({ id: `section-${number}`, index: number, tab: "Новый раздел", title: "Новый раздел", subtitle: "Короткий тезис", description: "Описание раздела" }); })}><Plus size={16} /> Добавить раздел</button>
        </div>
      </>;
    }

    if (activeBlock === "cases") {
      return <div className="admin-formSection">
        <h3>Заголовок портфолио</h3>
        <Field label="Надзаголовок"><input value={draft.cases.eyebrow} onChange={(event) => mutate((next) => { next.cases.eyebrow = event.target.value; })} /></Field>
        <Field label="Заголовок"><input value={draft.cases.title} onChange={(event) => mutate((next) => { next.cases.title = event.target.value; })} /></Field>
        <Field label="Описание"><textarea rows={4} value={draft.cases.description} onChange={(event) => mutate((next) => { next.cases.description = event.target.value; })} /></Field>
        <p className="admin-inlineNotice">Названия проектов, факты и фотогалереи находятся в отдельном разделе «Кейсы».</p>
      </div>;
    }

    if (activeBlock === "story") {
      return <>
        <div className="admin-formSection">
          <h3>Общая подпись</h3>
          <Field label="Название главы"><input value={draft.story.label} onChange={(event) => mutate((next) => { next.story.label = event.target.value; })} /></Field>
        </div>
        <div className="admin-formSection">
          <h3>Сцены</h3>
          {draft.story.scenes.map((scene, index) => <ItemCard key={index} title={`Сцена ${index + 1}`}>
            <div className="admin-fieldPair">
              <Field label="Заголовок"><input value={scene.title} onChange={(event) => mutate((next) => { next.story.scenes[index].title = event.target.value; })} /></Field>
              <Field label="Положение текста"><select value={scene.align} onChange={(event) => mutate((next) => { next.story.scenes[index].align = event.target.value as typeof scene.align; })}><option value="left">Слева</option><option value="right">Справа</option><option value="center">По центру</option></select></Field>
            </div>
            <Field label="Основной текст"><textarea rows={4} value={scene.text} onChange={(event) => mutate((next) => { next.story.scenes[index].text = event.target.value; })} /></Field>
            <Field label="Акцентная подпись"><input value={scene.aside} onChange={(event) => mutate((next) => { next.story.scenes[index].aside = event.target.value; })} /></Field>
            <div className="admin-fieldPair">
              <Field label="Текст действия"><input value={scene.action?.label ?? ""} placeholder="Без кнопки" onChange={(event) => mutate((next) => { const current = next.story.scenes[index].action; next.story.scenes[index].action = event.target.value ? { label: event.target.value, href: current?.href ?? "#brief" } : null; })} /></Field>
              <Field label="Ссылка действия"><input value={scene.action?.href ?? ""} disabled={!scene.action} onChange={(event) => mutate((next) => { if (next.story.scenes[index].action) next.story.scenes[index].action!.href = event.target.value; })} /></Field>
            </div>
          </ItemCard>)}
        </div>
      </>;
    }

    if (activeBlock === "faq") {
      return <>
        <div className="admin-formSection"><h3>Заголовок</h3><Field label="Название блока"><input value={draft.faq.title} onChange={(event) => mutate((next) => { next.faq.title = event.target.value; })} /></Field></div>
        <div className="admin-formSection">
          <h3>Вопросы</h3>
          {draft.faq.items.map((item, index) => <ItemCard key={index} title={`Вопрос ${index + 1}`} onRemove={() => mutate((next) => { next.faq.items.splice(index, 1); })}>
            <Field label="Вопрос"><input value={item.question} onChange={(event) => mutate((next) => { next.faq.items[index].question = event.target.value; })} /></Field>
            <Field label="Ответ"><textarea rows={3} value={item.answer} onChange={(event) => mutate((next) => { next.faq.items[index].answer = event.target.value; })} /></Field>
          </ItemCard>)}
          <button className="admin-addButton" type="button" onClick={() => mutate((next) => { next.faq.items.push({ question: "Новый вопрос", answer: "Ответ" }); })}><Plus size={16} /> Добавить вопрос</button>
        </div>
      </>;
    }

    if (activeBlock === "lead") {
      return <>
        <div className="admin-formSection">
          <h3>Заголовок формы</h3>
          <div className="admin-fieldPair">
            <Field label="Надзаголовок"><input value={draft.leadForm.eyebrow} onChange={(event) => mutate((next) => { next.leadForm.eyebrow = event.target.value; })} /></Field>
            <Field label="Заголовок"><input value={draft.leadForm.title} onChange={(event) => mutate((next) => { next.leadForm.title = event.target.value; })} /></Field>
          </div>
          <Field label="Описание"><textarea rows={3} value={draft.leadForm.description} onChange={(event) => mutate((next) => { next.leadForm.description = event.target.value; })} /></Field>
        </div>
        <div className="admin-formSection">
          <h3>Варианты выбора</h3>
          <Field label="Типы событий"><StringListEditor values={draft.leadForm.eventTypes} addLabel="Добавить тип" onChange={(values) => mutate((next) => { next.leadForm.eventTypes = values; })} /></Field>
          <Field label="Количество гостей"><StringListEditor values={draft.leadForm.guestRanges} addLabel="Добавить диапазон" onChange={(values) => mutate((next) => { next.leadForm.guestRanges = values; })} /></Field>
          <Field label="Способы связи" hint="Телефон и Email рекомендуется оставить"><StringListEditor values={draft.leadForm.contactTypes} addLabel="Добавить способ" onChange={(values) => mutate((next) => { next.leadForm.contactTypes = values; })} /></Field>
        </div>
        <div className="admin-formSection">
          <h3>Публичные контакты</h3>
          <div className="admin-fieldPair">
            <Field label="Почта"><input type="email" value={draft.contacts.email} onChange={(event) => mutate((next) => { next.contacts.email = event.target.value; })} /></Field>
            <Field label="Город"><input value={draft.contacts.city} onChange={(event) => mutate((next) => { next.contacts.city = event.target.value; })} /></Field>
          </div>
          <div className="admin-fieldPair">
            <Field label="Основной телефон"><input value={draft.contacts.phones[0]} onChange={(event) => mutate((next) => { next.contacts.phones[0] = event.target.value; })} /></Field>
            <Field label="Дополнительный телефон"><input value={draft.contacts.phones[1]} onChange={(event) => mutate((next) => { next.contacts.phones[1] = event.target.value; })} /></Field>
          </div>
        </div>
      </>;
    }

    if (activeBlock === "legal") {
      const documents = [
        { key: "privacy" as const, label: "Политика конфиденциальности" },
        { key: "personalData" as const, label: "Согласие на обработку данных" },
        { key: "cookies" as const, label: "Cookie и локальное хранилище" },
      ];

      return <div className="admin-formSection">
        <h3>Юридические документы</h3>
        <p className="admin-inlineNotice">Текст выводится как обычный текст без HTML. Это защищает публичный сайт от внедрения стороннего кода.</p>
        {documents.map(({ key, label }) => {
          const document = draft.legal[key];
          return <ItemCard key={key} title={label}>
            <Field label="Заголовок"><input value={document.title} onChange={(event) => mutate((next) => { next.legal[key].title = event.target.value; })} /></Field>
            <Field label="Вводный текст"><textarea rows={3} value={document.introduction} onChange={(event) => mutate((next) => { next.legal[key].introduction = event.target.value; })} /></Field>
            <Field label="Предупреждение или статус" hint="Можно оставить пустым"><textarea rows={2} value={document.status} onChange={(event) => mutate((next) => { next.legal[key].status = event.target.value; })} /></Field>
            <Field label="Редакция"><input value={document.revision} onChange={(event) => mutate((next) => { next.legal[key].revision = event.target.value; })} /></Field>
            {document.sections.map((section, index) => <div className="admin-legalSection" key={`${key}-${index}`}>
              <div className="admin-legalSection__header">
                <strong>Раздел {index + 1}</strong>
                <button type="button" aria-label={`Удалить раздел ${index + 1}`} onClick={() => mutate((next) => { next.legal[key].sections.splice(index, 1); })}><Trash2 size={15} /></button>
              </div>
              <Field label="Название раздела"><input value={section.title} onChange={(event) => mutate((next) => { next.legal[key].sections[index].title = event.target.value; })} /></Field>
              <Field label="Текст раздела"><textarea rows={4} value={section.body} onChange={(event) => mutate((next) => { next.legal[key].sections[index].body = event.target.value; })} /></Field>
            </div>)}
            <button className="admin-addButton" type="button" onClick={() => mutate((next) => { next.legal[key].sections.push({ title: "Новый раздел", body: "Текст раздела" }); })}><Plus size={16} /> Добавить раздел</button>
          </ItemCard>;
        })}
      </div>;
    }

    return <div className="admin-formSection">
      <h3>Финальный экран</h3>
      <Field label="Заголовок"><input value={draft.footer.heading} onChange={(event) => mutate((next) => { next.footer.heading = event.target.value; })} /></Field>
      <Field label="Описание"><textarea rows={3} value={draft.footer.description} onChange={(event) => mutate((next) => { next.footer.description = event.target.value; })} /></Field>
      <Field label="Текст о географии"><textarea rows={3} value={draft.footer.locationDescription} onChange={(event) => mutate((next) => { next.footer.locationDescription = event.target.value; })} /></Field>
    </div>;
  };

  return (
    <div className="admin-editorLayout">
      <aside className="admin-blockList" aria-label="Блоки страницы">
        <span>Блоки страницы</span>
        {blocks.map((block) => <button key={block.id} className={activeBlock === block.id ? "is-active" : ""} type="button" onClick={() => setActiveBlock(block.id)}><strong>{block.title}</strong><small>{block.caption}</small></button>)}
      </aside>

      <section className="admin-editor">
        <header>
          <div><span>{activeMeta.caption}</span><h2>{activeMeta.title}</h2><p>{blockDescriptions[activeBlock]}</p></div>
          <div className="admin-editorActions">
            <button className="admin-quietButton" type="button" onClick={() => void load()} disabled={loading || saving}><RefreshCcw size={16} /> Обновить</button>
            <button className="admin-primaryButton" type="button" onClick={() => void save()} disabled={!dirty || saving || !canEdit}>{saving ? <LoaderCircle className="is-spinning" size={16} /> : <Save size={16} />} Сохранить</button>
            <button className="admin-publishButton" type="button" onClick={() => void publish()} disabled={dirty || !document?.id || publishing || !canEdit}>{publishing ? <LoaderCircle className="is-spinning" size={16} /> : <Rocket size={16} />} Опубликовать</button>
          </div>
        </header>

        {loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем документ</div> : null}
        {message ? <p className="admin-successMessage"><Check size={16} />{message}</p> : null}
        {error ? <p className="admin-formError" role="alert">{error}</p> : null}
        {renderEditor()}

        <footer className="admin-editorFooter">
          <span>{dirty ? "Есть несохранённые изменения" : savedAt ? `Черновик сохранён ${new Date(savedAt).toLocaleString("ru-RU")}` : "Используется исходная версия"}</span>
          <a href="/?preview=local" target="_blank" rel="noreferrer">Открыть предпросмотр <ExternalLink size={16} /></a>
        </footer>
      </section>
    </div>
  );
}
