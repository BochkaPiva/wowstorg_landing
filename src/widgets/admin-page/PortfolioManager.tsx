import { Check, ChevronRight, ImageIcon, LoaderCircle, Plus, Save, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "@features/admin-auth/AdminAuthContext";
import {
  deletePortfolioImage,
  listPortfolio,
  savePortfolioProject,
  type PortfolioCollectionRecord,
  type PortfolioProjectInput,
  type PortfolioProjectRecord,
  uploadPortfolioImage,
} from "@features/portfolio-data/portfolioRepository";
import { MediaUploader } from "./MediaUploader";

const emptyProject = (collectionId = "teambuilding"): PortfolioProjectInput => ({ collectionId, slug: "", title: "", meta: "", lead: "", facts: [], result: "", status: "draft", sortOrder: 100 });
const slugify = (value: string) => value.toLocaleLowerCase("ru")
  .replace(/[а-яё]/g, (letter) => ({ а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" }[letter] ?? letter))
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 80) || `project-${Date.now()}`;

export function PortfolioManager() {
  const { user, profile } = useAdminAuth();
  const [collections, setCollections] = useState<PortfolioCollectionRecord[]>([]);
  const [projects, setProjects] = useState<PortfolioProjectRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PortfolioProjectInput>(emptyProject());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selected = projects.find((project) => project.id === selectedId) ?? null;
  const canEdit = profile?.role !== "viewer";
  const canDeleteMedia = profile?.role === "owner" || profile?.role === "admin";

  const load = async () => {
    setLoading(true);
    try { const data = await listPortfolio(); setCollections(data.collections); setProjects(data.projects); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить портфолио."); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const filtered = useMemo(() => { const needle = query.toLocaleLowerCase("ru"); return projects.filter((project) => !needle || project.title.toLocaleLowerCase("ru").includes(needle)); }, [projects, query]);
  const update = <K extends keyof PortfolioProjectInput>(key: K, value: PortfolioProjectInput[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const select = (project: PortfolioProjectRecord) => { const { id: _id, updatedAt: _updated, media: _media, ...input } = project; setSelectedId(project.id); setDraft(input); setMessage(null); setError(null); };
  const create = () => { setSelectedId(null); setDraft(emptyProject(collections[0]?.id)); setMessage(null); setError(null); };
  const save = async () => {
    if (!user || !canEdit) return;
    const slug = draft.slug || slugify(draft.title);
    if (draft.title.trim().length < 2) {
      setError("Добавьте название проекта.");
      return;
    }
    if (draft.lead.trim().length < 10) {
      setError("Опишите задачу проекта: это основа полноценного кейса.");
      return;
    }
    setSaving(true); setError(null); setMessage(null);
    try {
      const saved = await savePortfolioProject(selectedId, {
        ...draft,
        slug,
        facts: draft.facts.map((fact) => fact.trim()).filter(Boolean),
      }, user.id);
      setProjects((current) => selectedId ? current.map((project) => project.id === saved.id ? saved : project) : [saved, ...current]);
      setSelectedId(saved.id);
      const { id: _id, updatedAt: _updated, media: _media, ...input } = saved; setDraft(input);
      setMessage(saved.status === "published" ? "Кейс опубликован на сайте." : "Черновик кейса сохранён.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить кейс."); }
    finally { setSaving(false); }
  };
  const upload = async (file: File, alt: string) => {
    if (!selectedId) throw new Error("Сначала сохраните кейс.");
    const media = await uploadPortfolioImage(selectedId, file, alt, selected?.media.length ?? 0, !selected?.media.length);
    setProjects((current) => current.map((project) => project.id === selectedId ? { ...project, media: [...project.media, media] } : project));
  };

  return <div className="admin-manager">
    <aside className="admin-manager__list"><div className="admin-manager__tools"><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по кейсам" /></label><button type="button" onClick={create}><Plus size={17} /> Новый кейс</button></div>{loading ? <div className="admin-listState"><LoaderCircle className="is-spinning" size={22} /> Загружаем кейсы</div> : null}{!loading && !filtered.length ? <div className="admin-listState"><strong>Кейсов пока нет</strong><span>Добавьте только подтверждённый проект и реальные фотографии.</span></div> : null}<div className="admin-manager__rows">{filtered.map((project) => <button className={selectedId === project.id ? "is-active" : ""} type="button" key={project.id} onClick={() => select(project)}><div className="admin-rowThumb">{project.media[0] ? <img src={project.media[0].src} alt="" /> : <ImageIcon size={18} />}</div><span><strong>{project.title}</strong><small>{collections.find((collection) => collection.id === project.collectionId)?.title} · {project.status === "published" ? "Опубликован" : "Черновик"}</small></span><ChevronRight size={17} /></button>)}</div></aside>
    <section className="admin-manager__editor"><header><div><span>{selectedId ? "Проект портфолио" : "Новый кейс"}</span><h2>{draft.title || "Без названия"}</h2></div><div><select value={draft.status} disabled={!canEdit} onChange={(event) => update("status", event.target.value as PortfolioProjectInput["status"])}><option value="draft">Черновик</option><option value="published">Опубликован</option><option value="archived">Архив</option></select><button type="button" onClick={() => void save()} disabled={!canEdit || saving}>{saving ? <LoaderCircle className="is-spinning" size={17} /> : <Save size={17} />} Сохранить</button></div></header>{message ? <p className="admin-successMessage"><Check size={16} />{message}</p> : null}{error ? <p className="admin-formError" role="alert">{error}</p> : null}
      <div className="admin-editorGrid"><label className="admin-field"><span>Название проекта</span><input value={draft.title} onChange={(event) => update("title", event.target.value)} /></label><label className="admin-field"><span>Адрес кейса</span><input value={draft.slug} placeholder="Заполнится автоматически" onChange={(event) => update("slug", event.target.value.replace(/[^a-z0-9-]/g, ""))} /></label><label className="admin-field"><span>Направление</span><select value={draft.collectionId} onChange={(event) => update("collectionId", event.target.value)}>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.title}</option>)}</select></label><label className="admin-field"><span>Короткая мета-строка</span><input value={draft.meta} placeholder="Формат · город · аудитория" onChange={(event) => update("meta", event.target.value)} /></label><label className="admin-field admin-field--wide"><span>Задача и контекст</span><textarea rows={5} value={draft.lead} onChange={(event) => update("lead", event.target.value)} /></label><label className="admin-field"><span>Факты проекта</span><textarea rows={5} value={draft.facts.join("\n")} onChange={(event) => update("facts", event.target.value.split("\n"))} /><small>Каждый факт с новой строки</small></label><label className="admin-field"><span>Результат</span><textarea rows={5} value={draft.result} onChange={(event) => update("result", event.target.value)} /></label></div>
      <section className="admin-mediaSection"><header><div><h3>Фотографии проекта</h3><p>Первая фотография станет обложкой. Не публикуйте кейс без согласованных материалов.</p></div></header>{selectedId ? <MediaUploader onUpload={upload} label="Загрузить фотографии кейса" /> : <p className="admin-inlineNotice">Сохраните кейс, чтобы загрузить фотографии.</p>}<div className="admin-mediaGrid">{selected?.media.map((media) => <figure key={media.id}><img src={media.src} alt={media.alt} /><figcaption>{media.alt}{media.isCover ? " · Обложка" : ""}</figcaption>{canDeleteMedia ? <button type="button" onClick={() => void deletePortfolioImage(media).then(load)}><Trash2 size={15} /> Удалить</button> : null}</figure>)}</div></section>
    </section>
  </div>;
}
