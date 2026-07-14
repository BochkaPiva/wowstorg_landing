import { Archive, Check, ChevronRight, ImageIcon, LoaderCircle, Plus, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@features/admin-auth/AdminAuthContext";
import {
  deleteCatalogImage,
  listCatalogCategories,
  listCatalogItems,
  saveCatalogItem,
  type CatalogCategory,
  type CatalogItemInput,
  type CatalogItemRecord,
  uploadCatalogImage,
} from "@features/catalog-data/catalogRepository";
import { MediaUploader } from "./MediaUploader";

const emptyItem = (categoryId: CatalogCategory["id"] = "teambuilding"): CatalogItemInput => ({
  categoryId,
  kind: categoryId === "props" ? "prop" : categoryId === "teambuilding" ? "package" : "zone",
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  effectStatement: "",
  priceFrom: null,
  priceUnit: null,
  guestMin: null,
  guestMax: null,
  durationMin: null,
  durationMax: null,
  includedItems: [],
  requirements: [],
  badges: [],
  leadIntent: categoryId === "props" ? "rent" : "selection",
  status: "draft",
  isFeatured: false,
  sortOrder: 100,
});

const transliterate = (value: string) => value.toLocaleLowerCase("ru")
  .replace(/[а-яё]/g, (letter) => ({ а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" }[letter] ?? letter))
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

function TextList({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return <label className="admin-field"><span>{label}</span><textarea rows={3} value={values.join("\n")} onChange={(event) => onChange(event.target.value.split("\n"))} /><small>Каждый пункт с новой строки</small></label>;
}

export function CatalogManager() {
  const { user, profile } = useAdminAuth();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [items, setItems] = useState<CatalogItemRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CatalogItemInput>(emptyItem());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const canEdit = profile?.role !== "viewer";
  const canDeleteMedia = profile?.role === "owner" || profile?.role === "admin";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextItems] = await Promise.all([listCatalogCategories(), listCatalogItems()]);
      setCategories(nextCategories);
      setItems(nextItems);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить каталог.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return items.filter((item) => !needle || `${item.title} ${item.slug}`.toLocaleLowerCase("ru").includes(needle));
  }, [items, query]);

  const select = (item: CatalogItemRecord) => {
    setSelectedId(item.id);
    const { id: _id, updatedAt: _updatedAt, media: _media, ...input } = item;
    setDraft(input);
    setMessage(null);
    setError(null);
  };
  const create = () => { setSelectedId(null); setDraft(emptyItem(categories[0]?.id)); setMessage(null); setError(null); };
  const update = <K extends keyof CatalogItemInput>(key: K, value: CatalogItemInput[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!user || !canEdit) return;
    const slug = draft.slug || transliterate(draft.title);
    if (draft.title.trim().length < 2) {
      setError("Добавьте понятное название карточки.");
      return;
    }
    if (slug.length < 2) {
      setError("Не удалось сформировать адрес карточки. Укажите его вручную латиницей.");
      return;
    }
    if (draft.shortDescription.trim().length < 10) {
      setError("Короткое описание должно объяснять предложение хотя бы одним предложением.");
      return;
    }
    setSaving(true); setError(null); setMessage(null);
    try {
      const normalized = {
        ...draft,
        slug,
        includedItems: draft.includedItems.map((item) => item.trim()).filter(Boolean),
        requirements: draft.requirements.map((item) => item.trim()).filter(Boolean),
        badges: draft.badges.map((item) => item.trim()).filter(Boolean),
      };
      const saved = await saveCatalogItem(selectedId, normalized, user.id);
      setItems((current) => selectedId ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setSelectedId(saved.id);
      const { id: _id, updatedAt: _updatedAt, media: _media, ...input } = saved;
      setDraft(input);
      setMessage(saved.status === "published" ? "Карточка сохранена и видна в каталоге." : "Черновик сохранён.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить карточку."); }
    finally { setSaving(false); }
  };

  const upload = async (file: File, alt: string) => {
    if (!selectedId) throw new Error("Сначала сохраните карточку.");
    const media = await uploadCatalogImage(selectedId, file, alt, selected?.media.length ?? 0);
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, media: [...item.media, media] } : item));
  };

  return <div className="admin-manager">
    <aside className="admin-manager__list">
      <div className="admin-manager__tools"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по каталогу" /></label><button type="button" onClick={create}><Plus size={17} /> Новая карточка</button></div>
      {loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем позиции</div> : null}
      {!loading && !filtered.length ? <div className="admin-listState"><strong>Нет позиций</strong><span>Создайте первую карточку каталога.</span></div> : null}
      <div className="admin-manager__rows">{filtered.map((item) => <button className={selectedId === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => select(item)}><div className="admin-rowThumb">{item.media[0] ? <img src={item.media[0].src} alt="" /> : <ImageIcon size={18} />}</div><span><strong>{item.title}</strong><small>{categories.find((category) => category.id === item.categoryId)?.title} · {item.status === "published" ? "Опубликовано" : item.status === "draft" ? "Черновик" : "В архиве"}</small></span><ChevronRight size={17} /></button>)}</div>
    </aside>

    <section className="admin-manager__editor">
      <header><div><span>{selectedId ? "Карточка каталога" : "Новая карточка"}</span><h2>{draft.title || "Без названия"}</h2></div><div><select value={draft.status} disabled={!canEdit} onChange={(event) => update("status", event.target.value as CatalogItemInput["status"])}><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="archived">Архив</option></select><button type="button" onClick={() => void save()} disabled={!canEdit || saving}>{saving ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />} Сохранить</button></div></header>
      {message ? <p className="admin-successMessage"><Check size={16} />{message}</p> : null}{error ? <p className="admin-formError" role="alert">{error}</p> : null}
      <div className="admin-editorGrid">
        <label className="admin-field"><span>Название</span><input value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="admin-field"><span>Адрес карточки</span><input value={draft.slug} placeholder="Заполнится автоматически" onChange={(event) => update("slug", transliterate(event.target.value))} /></label>
        <label className="admin-field"><span>Раздел</span><select value={draft.categoryId} onChange={(event) => update("categoryId", event.target.value as CatalogCategory["id"])}>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label>
        <label className="admin-field"><span>Тип</span><select value={draft.kind} onChange={(event) => update("kind", event.target.value as CatalogItemInput["kind"])}><option value="package">Пакет</option><option value="zone">Зона</option><option value="service">Услуга</option><option value="prop">Реквизит</option></select></label>
        <label className="admin-field"><span>Цена от</span><input type="number" min="0" step="100" value={draft.priceFrom ?? ""} placeholder="Не указывать" onChange={(event) => update("priceFrom", event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="admin-field"><span>Единица цены</span><input value={draft.priceUnit ?? ""} placeholder="за программу / в сутки" onChange={(event) => update("priceUnit", event.target.value || null)} /></label>
        <label className="admin-field"><span>Действие в заявке</span><select value={draft.leadIntent} onChange={(event) => update("leadIntent", event.target.value as CatalogItemInput["leadIntent"])}><option value="selection">Добавить в подборку</option><option value="estimate">Запросить расчёт</option><option value="rent">Запросить аренду</option><option value="consultation">Обсудить с менеджером</option></select></label>
        <label className="admin-field admin-field--wide"><span>Короткое описание</span><textarea rows={3} maxLength={320} value={draft.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></label>
        <label className="admin-field admin-field--wide"><span>Полное описание</span><textarea rows={6} maxLength={8000} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
        <label className="admin-field admin-field--wide"><span>Главный эффект</span><textarea rows={2} maxLength={500} value={draft.effectStatement} onChange={(event) => update("effectStatement", event.target.value)} /></label>
        <label className="admin-field"><span>Гостей от</span><input type="number" min="1" value={draft.guestMin ?? ""} onChange={(event) => update("guestMin", event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="admin-field"><span>Гостей до</span><input type="number" min="1" value={draft.guestMax ?? ""} onChange={(event) => update("guestMax", event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="admin-field"><span>Минут от</span><input type="number" min="1" value={draft.durationMin ?? ""} onChange={(event) => update("durationMin", event.target.value ? Number(event.target.value) : null)} /></label>
        <label className="admin-field"><span>Минут до</span><input type="number" min="1" value={draft.durationMax ?? ""} onChange={(event) => update("durationMax", event.target.value ? Number(event.target.value) : null)} /></label>
        <TextList label="В составе" values={draft.includedItems} onChange={(value) => update("includedItems", value)} />
        <TextList label="Требования" values={draft.requirements} onChange={(value) => update("requirements", value)} />
        <TextList label="Метки" values={draft.badges} onChange={(value) => update("badges", value)} />
        <label className="admin-field"><span>Порядок</span><input type="number" value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></label>
        <label className="admin-checkField"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /><span>Показывать выше остальных</span></label>
      </div>

      <section className="admin-mediaSection"><header><div><h3>Фотографии</h3><p>Можно выбрать сразу несколько файлов. Первое изображение станет обложкой, остальные появятся в галерее карточки.</p></div></header>{selectedId ? <MediaUploader multiple onUpload={upload} label="Добавить фотографии" /> : <p className="admin-inlineNotice">Сохраните карточку, чтобы загрузить изображения.</p>}<div className="admin-mediaGrid">{selected?.media.map((media, index) => <figure key={media.id}><span className="admin-mediaGrid__index">{index === 0 ? "Обложка" : `Фото ${index + 1}`}</span><img src={media.src} alt={media.alt} /><figcaption>{media.alt}</figcaption>{canDeleteMedia ? <button type="button" onClick={() => void deleteCatalogImage(media).then(load)}><Archive size={15} /> Удалить</button> : null}</figure>)}</div></section>
    </section>
  </div>;
}
