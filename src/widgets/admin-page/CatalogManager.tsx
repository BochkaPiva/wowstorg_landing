import { Archive, Check, ChevronRight, ExternalLink, FileText, ImageIcon, LoaderCircle, Plus, RotateCcw, Save, Search, Trash2, Upload } from "lucide-react";
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAdminAuth } from "@features/admin-auth/AdminAuthContext";
import {
  deleteCatalogImage,
  deleteCatalogPresentation,
  listCatalogCategories,
  listCatalogItems,
  listCatalogPropGroups,
  saveCatalogItem,
  type CatalogCategory,
  type CatalogItemInput,
  type CatalogItemRecord,
  type CatalogPropGroup,
  uploadCatalogImage,
  uploadCatalogImages,
  uploadCatalogPresentation,
} from "@features/catalog-data/catalogRepository";
import { MediaUploader } from "./MediaUploader";
import { PropGroupsManager } from "./PropGroupsManager";

const emptyItem = (categoryId: CatalogCategory["id"] = "teambuilding"): CatalogItemInput => ({
  categoryId,
  propGroupId: null,
  kind: categoryId === "props" ? "prop" : categoryId === "teambuilding" ? "package" : "zone",
  slug: "",
  title: "",
  shortDescription: "",
  description: "",
  effectStatement: "",
  priceFrom: null,
  priceUnit: categoryId === "props" ? "в сутки" : null,
  stockQuantity: null,
  presentationPath: null,
  presentationName: null,
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

const makeUniqueSlug = (title: string, items: CatalogItemRecord[], selectedId: string | null) => {
  const base = transliterate(title) || `item-${Date.now()}`;
  const occupied = new Set(items.filter((item) => item.id !== selectedId).map((item) => item.slug));
  if (!occupied.has(base)) return base;
  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
};

const kindLabels: Record<CatalogItemRecord["kind"], string> = {
  package: "Программа",
  zone: "Игровая зона",
  service: "Услуга",
  prop: "Реквизит",
};

const statusLabels: Record<CatalogItemRecord["status"], string> = {
  draft: "Черновик",
  published: "Опубликовано",
  archived: "В архиве",
};

function TextList({ label, values, onChange }: { label: string; values: string[]; onChange: (values: string[]) => void }) {
  return <label className="admin-field"><span>{label}</span><textarea rows={3} value={values.join("\n")} onChange={(event) => onChange(event.target.value.split("\n"))} /><small>Каждый пункт с новой строки</small></label>;
}

function openFilePickerFromKeyboard(event: ReactKeyboardEvent<HTMLLabelElement>) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  event.currentTarget.querySelector<HTMLInputElement>('input[type="file"]')?.click();
}

export function CatalogManager() {
  const { user, profile } = useAdminAuth();
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [items, setItems] = useState<CatalogItemRecord[]>([]);
  const [propGroups, setPropGroups] = useState<CatalogPropGroup[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CatalogItemInput>(emptyItem());
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | CatalogCategory["id"]>("all");
  const [propGroupFilter, setPropGroupFilter] = useState<"all" | "unassigned" | string>("all");
  const [kindFilter, setKindFilter] = useState<"all" | CatalogItemRecord["kind"]>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CatalogItemRecord["status"]>("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPresentation, setUploadingPresentation] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ files: File[]; alt: string }>({ files: [], alt: "" });
  const [mediaResetToken, setMediaResetToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const canEdit = profile?.role !== "viewer";
  const canDeleteMedia = profile?.role === "owner" || profile?.role === "admin";
  const updatePropGroups = (nextGroups: CatalogPropGroup[]) => {
    const existingIds = new Set(nextGroups.map((group) => group.id));
    setPropGroups(nextGroups);
    setItems((current) => current.map((item) => item.propGroupId && !existingIds.has(item.propGroupId) ? { ...item, propGroupId: null } : item));
    setDraft((current) => current.propGroupId && !existingIds.has(current.propGroupId) ? { ...current, propGroupId: null } : current);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextItems, nextPropGroups] = await Promise.all([listCatalogCategories(), listCatalogItems(), listCatalogPropGroups(true)]);
      setCategories(nextCategories);
      setItems(nextItems);
      setPropGroups(nextPropGroups);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить каталог.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ru");
    return items.filter((item) => {
      const searchable = `${item.title} ${item.slug} ${item.shortDescription} ${item.badges.join(" ")}`.toLocaleLowerCase("ru");
      return (!needle || searchable.includes(needle))
        && (categoryFilter === "all" || item.categoryId === categoryFilter)
        && (categoryFilter !== "props" || propGroupFilter === "all" || (propGroupFilter === "unassigned" ? !item.propGroupId : item.propGroupId === propGroupFilter))
        && (kindFilter === "all" || item.kind === kindFilter)
        && (statusFilter === "all" || item.status === statusFilter);
    });
  }, [categoryFilter, items, kindFilter, propGroupFilter, query, statusFilter]);

  const hasFilters = Boolean(query.trim()) || categoryFilter !== "all" || propGroupFilter !== "all" || kindFilter !== "all" || statusFilter !== "all";

  const resetPendingImages = () => {
    setPendingImages({ files: [], alt: "" });
    setMediaResetToken((current) => current + 1);
  };

  const select = (item: CatalogItemRecord) => {
    resetPendingImages();
    setSelectedId(item.id);
    const { id: _id, updatedAt: _updatedAt, media: _media, presentationUrl: _presentationUrl, ...input } = item;
    setDraft(input);
    setMessage(null);
    setError(null);
  };
  const create = () => {
    resetPendingImages();
    const categoryId = categoryFilter === "all" ? categories[0]?.id : categoryFilter;
    const next = emptyItem(categoryId);
    if (categoryId === "props" && propGroupFilter !== "all" && propGroupFilter !== "unassigned") next.propGroupId = propGroupFilter;
    setSelectedId(null);
    setDraft(next);
    setMessage(null);
    setError(null);
    requestAnimationFrame(() => titleInputRef.current?.focus());
  };
  const update = <K extends keyof CatalogItemInput>(key: K, value: CatalogItemInput[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const changeCategory = (categoryId: CatalogCategory["id"]) => setDraft((current) => {
    if (categoryId === "props") {
      return {
        ...current,
        categoryId,
        kind: "prop",
        leadIntent: "rent",
        priceUnit: "в сутки",
        presentationPath: null,
        presentationName: null,
      };
    }
    if (current.kind === "prop") {
      return {
        ...current,
        categoryId,
        propGroupId: null,
        kind: categoryId === "teambuilding" ? "package" : "zone",
        leadIntent: "selection",
        stockQuantity: null,
      };
    }
    return { ...current, categoryId };
  });
  const changeKind = (kind: CatalogItemRecord["kind"]) => setDraft((current) => {
    if (kind === "prop") {
      return {
        ...current,
        kind,
        categoryId: "props",
        leadIntent: "rent",
        priceUnit: "в сутки",
        presentationPath: null,
        presentationName: null,
      };
    }
    const categoryId = current.categoryId === "props"
      ? kind === "package" ? "teambuilding" : kind === "zone" ? "game_zone" : "welcome"
      : current.categoryId;
    return {
      ...current,
      kind,
      categoryId,
      propGroupId: null,
      leadIntent: current.leadIntent === "rent" ? "selection" : current.leadIntent,
      stockQuantity: null,
    };
  });

  const isProp = draft.kind === "prop";
  const supportsGuests = draft.kind === "package" || draft.kind === "zone";
  const supportsDuration = !isProp;
  const editorProfile = isProp
    ? {
        title: "Карточка реквизита",
        description: "Достаточно названия, цены и количества. Адрес создаётся автоматически, цена всегда указана за сутки.",
      }
    : draft.kind === "package"
      ? {
          title: "Готовая программа",
          description: "Для программы можно указать подходящий диапазон гостей, длительность и состав предложения.",
        }
      : draft.kind === "zone"
        ? {
            title: "Игровая зона",
            description: "Укажите масштаб аудитории, время работы, состав станции и требования к площадке.",
          }
        : {
            title: "Услуга",
            description: "Опишите результат услуги и длительность, если она заранее определена.",
          };

  const save = async (createNext = false) => {
    if (!user || !canEdit) return;
    const slug = selectedId && draft.slug ? draft.slug : makeUniqueSlug(draft.title, items, selectedId);
    if (draft.title.trim().length < 2) {
      setError("Добавьте понятное название карточки.");
      return;
    }
    if (!isProp && draft.shortDescription.trim().length < 10) {
      setError("Короткое описание должно объяснять предложение хотя бы одним предложением.");
      return;
    }
    if (!selectedId && pendingImages.files.length && pendingImages.alt.trim().length < 2) {
      setError("Добавьте короткое описание выбранных фотографий.");
      return;
    }
    setSaving(true); setError(null); setMessage(null);
    try {
      const normalizedIsProp = draft.kind === "prop";
      const normalizedSupportsGuests = draft.kind === "package" || draft.kind === "zone";
      const normalized = {
        ...draft,
        slug,
        shortDescription: normalizedIsProp && draft.shortDescription.trim().length < 10
          ? `Аренда реквизита «${draft.title.trim()}» для мероприятий.`
          : draft.shortDescription.trim(),
        effectStatement: normalizedIsProp ? "" : draft.effectStatement.trim(),
        priceUnit: normalizedIsProp ? "в сутки" : draft.priceUnit,
        leadIntent: normalizedIsProp ? "rent" as const : draft.leadIntent,
        stockQuantity: normalizedIsProp ? draft.stockQuantity : null,
        presentationPath: normalizedIsProp ? null : draft.presentationPath,
        presentationName: normalizedIsProp ? null : draft.presentationName,
        guestMin: normalizedSupportsGuests ? draft.guestMin : null,
        guestMax: normalizedSupportsGuests ? draft.guestMax : null,
        durationMin: normalizedIsProp ? null : draft.durationMin,
        durationMax: normalizedIsProp ? null : draft.durationMax,
        includedItems: normalizedIsProp ? [] : draft.includedItems.map((item) => item.trim()).filter(Boolean),
        requirements: draft.requirements.map((item) => item.trim()).filter(Boolean),
        badges: draft.badges.map((item) => item.trim()).filter(Boolean),
      };
      const saved = await saveCatalogItem(selectedId, normalized, user.id);
      let savedWithMedia = saved;
      if (!selectedId && pendingImages.files.length) {
        try {
          const uploadedMedia = await uploadCatalogImages(
            saved.id,
            pendingImages.files.map((file, index) => ({
              file,
              alt: pendingImages.files.length > 1 ? `${pendingImages.alt.trim()} ${index + 1}` : pendingImages.alt.trim(),
            })),
            saved.media.length,
          );
          savedWithMedia = { ...saved, media: [...saved.media, ...uploadedMedia] };
          resetPendingImages();
        } catch (cause) {
          setItems((current) => [saved, ...current]);
          setSelectedId(saved.id);
          const { id: _id, updatedAt: _updatedAt, media: _media, presentationUrl: _presentationUrl, ...input } = saved;
          setDraft(input);
          throw new Error(`Карточка сохранена, но фотографии загрузить не удалось. ${cause instanceof Error ? cause.message : "Попробуйте загрузить их ещё раз."}`);
        }
      }
      setItems((current) => selectedId ? current.map((item) => item.id === savedWithMedia.id ? savedWithMedia : item) : [savedWithMedia, ...current]);
      if (createNext && normalizedIsProp) {
        const next = emptyItem("props");
        next.status = savedWithMedia.status;
        next.propGroupId = savedWithMedia.propGroupId;
        setSelectedId(null);
        setDraft(next);
        setMessage("Реквизит сохранён. Можно сразу добавить следующую позицию.");
        requestAnimationFrame(() => titleInputRef.current?.focus());
      } else {
        setSelectedId(savedWithMedia.id);
        const { id: _id, updatedAt: _updatedAt, media: _media, presentationUrl: _presentationUrl, ...input } = savedWithMedia;
        setDraft(input);
        const hasNewImages = !selectedId && pendingImages.files.length > 0;
        setMessage(savedWithMedia.status === "published"
          ? hasNewImages ? "Карточка и фотографии сохранены и видны в каталоге." : "Карточка сохранена и видна в каталоге."
          : hasNewImages ? "Черновик и фотографии сохранены." : "Черновик сохранён.");
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить карточку."); }
    finally { setSaving(false); }
  };

  const upload = async (file: File, alt: string) => {
    if (!selectedId) throw new Error("Сначала сохраните карточку.");
    const media = await uploadCatalogImage(selectedId, file, alt, selected?.media.length ?? 0);
    setItems((current) => current.map((item) => item.id === selectedId ? { ...item, media: [...item.media, media] } : item));
  };

  const syncSelectedItem = (item: CatalogItemRecord) => {
    setItems((current) => current.map((currentItem) => currentItem.id === item.id ? item : currentItem));
    setDraft((current) => ({
      ...current,
      presentationPath: item.presentationPath,
      presentationName: item.presentationName,
    }));
  };

  const uploadPresentation = async (file: File) => {
    if (!selectedId || !user) {
      setError("Сначала сохраните карточку, затем загрузите презентацию.");
      return;
    }
    setUploadingPresentation(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await uploadCatalogPresentation(selectedId, file, user.id, selected?.presentationPath);
      syncSelectedItem(saved);
      setMessage("PDF-презентация загружена и доступна клиентам.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить презентацию.");
    } finally {
      setUploadingPresentation(false);
    }
  };

  const removePresentation = async () => {
    if (!selectedId || !selected?.presentationPath || !user || !canDeleteMedia) return;
    setUploadingPresentation(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await deleteCatalogPresentation(selectedId, selected.presentationPath, user.id);
      syncSelectedItem(saved);
      setMessage("PDF-презентация удалена.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить презентацию.");
    } finally {
      setUploadingPresentation(false);
    }
  };

  return <div className="admin-manager">
    <aside className="admin-manager__list">
      <div className="admin-manager__tools">
        <label className="admin-manager__search">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, описание или метка" />
        </label>
        <div className="admin-manager__filters">
          <label className="is-wide">
            <span>Раздел</span>
            <select value={categoryFilter} onChange={(event) => { const value = event.target.value as typeof categoryFilter; setCategoryFilter(value); if (value !== "props") setPropGroupFilter("all"); }}>
              <option value="all">Все разделы</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
            </select>
          </label>
          {categoryFilter === "props" ? <label className="is-wide"><span>Раздел реквизита</span><select value={propGroupFilter} onChange={(event) => setPropGroupFilter(event.target.value)}><option value="all">Все разделы</option><option value="unassigned">Без раздела</option>{propGroups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}</select></label> : null}
          <label>
            <span>Тип</span>
            <select value={kindFilter} onChange={(event) => setKindFilter(event.target.value as typeof kindFilter)}>
              <option value="all">Все типы</option>
              <option value="package">Программы</option>
              <option value="zone">Игровые зоны</option>
              <option value="service">Услуги</option>
              <option value="prop">Реквизит</option>
            </select>
          </label>
          <label>
            <span>Статус</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">Все статусы</option>
              <option value="published">Опубликовано</option>
              <option value="draft">Черновики</option>
              <option value="archived">В архиве</option>
            </select>
          </label>
        </div>
        <div className="admin-manager__filterMeta">
          <span>{filtered.length} из {items.length}</span>
          {hasFilters ? <button type="button" onClick={() => { setQuery(""); setCategoryFilter("all"); setPropGroupFilter("all"); setKindFilter("all"); setStatusFilter("all"); }}><RotateCcw size={13} /> Сбросить</button> : null}
        </div>
        <div className="admin-manager__createActions"><button className="admin-manager__new" type="button" onClick={create}><Plus size={17} /> Новая карточка</button><PropGroupsManager groups={propGroups} userId={user?.id ?? null} canEdit={canEdit} canDelete={canDeleteMedia} onChange={updatePropGroups} /></div>
      </div>
      {loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем позиции</div> : null}
      {!loading && !filtered.length ? <div className="admin-listState"><strong>{hasFilters ? "Ничего не найдено" : "Нет позиций"}</strong><span>{hasFilters ? "Измените запрос или сбросьте фильтры." : "Создайте первую карточку каталога."}</span></div> : null}
      <div className="admin-manager__rows">{filtered.map((item) => <button className={selectedId === item.id ? "is-active" : ""} type="button" key={item.id} onClick={() => select(item)}><div className="admin-rowThumb">{item.media[0] ? <img src={item.media[0].src} alt="" /> : <ImageIcon size={18} />}</div><span><strong>{item.title}</strong><small>{item.categoryId === "props" ? propGroups.find((group) => group.id === item.propGroupId)?.title ?? "Без раздела" : categories.find((category) => category.id === item.categoryId)?.title} · {statusLabels[item.status]}</small></span><ChevronRight size={17} /></button>)}</div>
    </aside>

    <section className="admin-manager__editor">
      <header><div><span>{selectedId ? "Карточка каталога" : "Новая карточка"}</span><h2>{draft.title || "Без названия"}</h2></div><div><select value={draft.status} disabled={!canEdit} onChange={(event) => update("status", event.target.value as CatalogItemInput["status"])}><option value="draft">Черновик</option><option value="published">Опубликовано</option><option value="archived">Архив</option></select><button type="button" onClick={() => void save()} disabled={!canEdit || saving}>{saving ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />} Сохранить</button>{isProp ? <button className="is-secondary" type="button" onClick={() => void save(true)} disabled={!canEdit || saving}><Plus size={17} /> Сохранить и следующий</button> : null}</div></header>
      {message ? <p className="admin-successMessage"><Check size={16} />{message}</p> : null}{error ? <p className="admin-formError" role="alert">{error}</p> : null}
      <div className="admin-editorGrid">
        <label className="admin-field"><span>Название</span><input ref={titleInputRef} value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label className="admin-field"><span>Раздел</span><select value={draft.categoryId} onChange={(event) => changeCategory(event.target.value as CatalogCategory["id"])}>{categories.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}</select></label>
        {isProp ? <label className="admin-field"><span>Раздел реквизита</span><select value={draft.propGroupId ?? ""} onChange={(event) => update("propGroupId", event.target.value || null)}><option value="">Без раздела</option>{propGroups.map((group) => <option key={group.id} value={group.id}>{group.title}{group.isVisible ? "" : " · скрыт"}</option>)}</select><small>Сохранится и для следующей позиции.</small></label> : null}
        {!isProp ? <label className="admin-field"><span>Тип</span><select value={draft.kind} onChange={(event) => changeKind(event.target.value as CatalogItemInput["kind"])}>{Object.entries(kindLabels).filter(([value]) => value !== "prop").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}
        <div className="admin-typeNote admin-field--wide"><strong>{editorProfile.title}</strong><span>{editorProfile.description}</span></div>
        <label className="admin-field"><span>{isProp ? "Цена за единицу" : "Цена от"}</span><input type="number" min="0" step={isProp ? 1 : 100} value={draft.priceFrom ?? ""} placeholder="Не указывать" onChange={(event) => update("priceFrom", event.target.value ? Number(event.target.value) : null)} /></label>
        {!isProp ? <label className="admin-field"><span>Единица цены</span><input value={draft.priceUnit ?? ""} placeholder="за программу / в сутки" onChange={(event) => update("priceUnit", event.target.value || null)} /></label> : null}
        {isProp ? <label className="admin-field"><span>Количество в наличии</span><input type="number" min="0" step="1" value={draft.stockQuantity ?? ""} placeholder="Не отслеживать" onChange={(event) => update("stockQuantity", event.target.value === "" ? null : Number(event.target.value))} /><small>Оставьте пустым, если остаток не ведётся.</small></label> : null}
        {!isProp ? <label className="admin-field"><span>Действие в заявке</span><select value={draft.leadIntent} onChange={(event) => update("leadIntent", event.target.value as CatalogItemInput["leadIntent"])}><option value="selection">Добавить в подборку</option><option value="estimate">Запросить расчёт</option><option value="rent">Запросить аренду</option><option value="consultation">Обсудить с менеджером</option></select></label> : null}
        {!isProp ? <><label className="admin-field admin-field--wide"><span>Короткое описание</span><textarea rows={3} maxLength={320} value={draft.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></label>
        <label className="admin-field admin-field--wide"><span>Полное описание</span><textarea rows={6} maxLength={8000} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label></> : null}
        {!isProp ? <label className="admin-field admin-field--wide"><span>Главный эффект</span><textarea rows={2} maxLength={500} value={draft.effectStatement} onChange={(event) => update("effectStatement", event.target.value)} /></label> : null}
        {supportsGuests ? <><label className="admin-field"><span>Гостей от</span><input type="number" min="1" value={draft.guestMin ?? ""} onChange={(event) => update("guestMin", event.target.value ? Number(event.target.value) : null)} /></label><label className="admin-field"><span>Гостей до</span><input type="number" min="1" value={draft.guestMax ?? ""} onChange={(event) => update("guestMax", event.target.value ? Number(event.target.value) : null)} /></label></> : null}
        {supportsDuration ? <><label className="admin-field"><span>Минут от</span><input type="number" min="1" value={draft.durationMin ?? ""} onChange={(event) => update("durationMin", event.target.value ? Number(event.target.value) : null)} /></label><label className="admin-field"><span>Минут до</span><input type="number" min="1" value={draft.durationMax ?? ""} onChange={(event) => update("durationMax", event.target.value ? Number(event.target.value) : null)} /></label></> : null}
        {!isProp ? <TextList label="В составе" values={draft.includedItems} onChange={(value) => update("includedItems", value)} /> : null}
        {!isProp ? <><TextList label="Требования" values={draft.requirements} onChange={(value) => update("requirements", value)} />
        <TextList label="Метки" values={draft.badges} onChange={(value) => update("badges", value)} />
        <label className="admin-field"><span>Порядок</span><input type="number" value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></label>
        <label className="admin-checkField"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /><span>Показывать выше остальных</span></label></> : <details className="admin-optionalFields admin-field--wide"><summary>Дополнительные поля</summary><div className="admin-optionalFields__grid">
          <label className="admin-field admin-field--wide"><span>Короткое описание</span><textarea rows={3} maxLength={320} placeholder="Если оставить пустым, текст создастся автоматически" value={draft.shortDescription} onChange={(event) => update("shortDescription", event.target.value)} /></label>
          <label className="admin-field admin-field--wide"><span>Полное описание</span><textarea rows={5} maxLength={8000} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
          <TextList label="Условия аренды" values={draft.requirements} onChange={(value) => update("requirements", value)} />
          <TextList label="Метки" values={draft.badges} onChange={(value) => update("badges", value)} />
          <label className="admin-field"><span>Порядок</span><input type="number" value={draft.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} /></label>
          <label className="admin-checkField"><input type="checkbox" checked={draft.isFeatured} onChange={(event) => update("isFeatured", event.target.checked)} /><span>Показывать выше остальных</span></label>
        </div></details>}
      </div>

      {!isProp ? <section className="admin-mediaSection admin-presentationSection">
        <header><div><h3>PDF-презентация</h3><p>Один файл до 30 МБ. В опубликованной карточке клиент сможет открыть его в браузере.</p></div></header>
        {!selectedId ? <p className="admin-inlineNotice">Сохраните карточку, чтобы загрузить презентацию.</p> : selected?.presentationUrl ? <div className="admin-presentationFile">
          <a href={selected.presentationUrl} target="_blank" rel="noreferrer"><FileText size={22} /><span><strong>{selected.presentationName || "Презентация.pdf"}</strong><small>Открыть PDF</small></span><ExternalLink size={16} /></a>
          {canDeleteMedia ? <div className="admin-presentationFile__actions"><label className={uploadingPresentation ? "is-disabled" : ""} role="button" tabIndex={uploadingPresentation ? -1 : 0} aria-disabled={uploadingPresentation} onKeyDown={openFilePickerFromKeyboard}><Upload size={15} /> Заменить<input type="file" accept="application/pdf,.pdf" disabled={uploadingPresentation} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPresentation(file); event.currentTarget.value = ""; }} /></label><button type="button" disabled={uploadingPresentation} onClick={() => void removePresentation()}><Trash2 size={15} /> Удалить</button></div> : null}
        </div> : <label className={uploadingPresentation ? "admin-presentationUpload is-disabled" : "admin-presentationUpload"} role="button" tabIndex={!canEdit || uploadingPresentation ? -1 : 0} aria-disabled={!canEdit || uploadingPresentation} onKeyDown={openFilePickerFromKeyboard}>{uploadingPresentation ? <LoaderCircle className="is-spinning" size={20} /> : <Upload size={20} />}<span><strong>{uploadingPresentation ? "Загружаем…" : "Выбрать PDF"}</strong><small>Презентация появится в клиентском каталоге</small></span><input type="file" accept="application/pdf,.pdf" disabled={!canEdit || uploadingPresentation} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPresentation(file); event.currentTarget.value = ""; }} /></label>}
      </section> : null}

      <section className="admin-mediaSection"><header><div><h3>Фотографии</h3><p>Можно выбрать сразу несколько файлов. Первое изображение станет обложкой, остальные появятся в галерее карточки.</p></div></header><MediaUploader multiple onUpload={upload} onPendingChange={(files, alt) => setPendingImages({ files, alt })} deferred={!selectedId} resetToken={mediaResetToken} suggestedAlt={draft.title} label={selectedId ? "Добавить фотографии" : "Выбрать фотографии"} /><div className="admin-mediaGrid">{selected?.media.map((media, index) => <figure key={media.id}><span className="admin-mediaGrid__index">{index === 0 ? "Обложка" : `Фото ${index + 1}`}</span><img src={media.src} alt={media.alt} /><figcaption>{media.alt}</figcaption>{canDeleteMedia ? <button type="button" onClick={() => void deleteCatalogImage(media).then(load)}><Archive size={15} /> Удалить</button> : null}</figure>)}</div></section>
    </section>
  </div>;
}
