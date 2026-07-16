import { Eye, EyeOff, LoaderCircle, Plus, Save, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  deleteCatalogPropGroup,
  saveCatalogPropGroup,
  type CatalogPropGroup,
} from "@features/catalog-data/catalogRepository";

function createSlug(title: string, groups: CatalogPropGroup[]) {
  const base = title.toLocaleLowerCase("ru")
    .replace(/[а-яё]/g, (letter) => ({ а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" }[letter] ?? letter))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72) || `group-${Date.now()}`;
  const occupied = new Set(groups.map((group) => group.slug));
  if (!occupied.has(base)) return base;
  let suffix = 2;
  while (occupied.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function PropGroupsManager({
  groups,
  userId,
  canEdit,
  canDelete,
  onChange,
}: {
  groups: CatalogPropGroup[];
  userId: string | null;
  canEdit: boolean;
  canDelete: boolean;
  onChange: (groups: CatalogPropGroup[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [drafts, setDrafts] = useState<Record<string, CatalogPropGroup>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const close = () => { setOpen(false); setDeleteId(null); setError(null); };

  useEffect(() => {
    setDrafts(Object.fromEntries(groups.map((group) => [group.id, group])));
  }, [groups]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const create = async () => {
    if (!userId || !canEdit || newTitle.trim().length < 2) return;
    setBusyId("new"); setError(null);
    try {
      const saved = await saveCatalogPropGroup(null, {
        slug: createSlug(newTitle, groups),
        title: newTitle,
        sortOrder: (groups[groups.length - 1]?.sortOrder ?? 0) + 10,
        isVisible: true,
      }, userId);
      onChange([...groups, saved].sort((a, b) => a.sortOrder - b.sortOrder));
      setNewTitle("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать раздел.");
    } finally { setBusyId(null); }
  };

  const save = async (id: string) => {
    if (!userId || !canEdit || !drafts[id]) return;
    setBusyId(id); setError(null);
    try {
      const saved = await saveCatalogPropGroup(id, drafts[id], userId);
      onChange(groups.map((group) => group.id === id ? saved : group).sort((a, b) => a.sortOrder - b.sortOrder));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить раздел.");
    } finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    if (!canDelete) return;
    if (deleteId !== id) { setDeleteId(id); return; }
    setBusyId(id); setError(null);
    try {
      await deleteCatalogPropGroup(id);
      onChange(groups.filter((group) => group.id !== id));
      setDeleteId(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить раздел.");
    } finally { setBusyId(null); }
  };

  return <>
    <button className="admin-propGroupsButton" type="button" onClick={() => setOpen(true)}><Settings2 size={16} /> Разделы реквизита</button>
    <dialog ref={dialogRef} className="admin-propGroupsDialog" onCancel={close} onClose={close}>
      <header><div><span>Структура каталога</span><h2>Разделы реквизита</h2><p>Разделы работают как фильтры в клиентском каталоге. Если скрыть раздел, его позиции останутся во «Весь реквизит».</p></div><button type="button" onClick={close} aria-label="Закрыть"><X size={21} /></button></header>
      {canEdit ? <div className="admin-propGroupsDialog__create"><label><span>Новый раздел</span><input value={newTitle} maxLength={80} placeholder="Например, Активный реквизит" onChange={(event) => setNewTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void create(); } }} /></label><button type="button" disabled={busyId !== null || newTitle.trim().length < 2} onClick={() => void create()}>{busyId === "new" ? <LoaderCircle className="is-spinning" size={17} /> : <Plus size={17} />} Добавить</button></div> : null}
      {error ? <p className="admin-formError" role="alert">{error}</p> : null}
      <div className="admin-propGroupsDialog__list">
        {!groups.length ? <div className="admin-listState"><strong>Разделов пока нет</strong><span>Добавьте первый раздел и назначьте его карточкам реквизита.</span></div> : null}
        {groups.map((group) => {
          const draft = drafts[group.id] ?? group;
          const changed = draft.title !== group.title || draft.sortOrder !== group.sortOrder || draft.isVisible !== group.isVisible;
          return <article key={group.id}>
            <label><span>Название</span><input value={draft.title} maxLength={80} disabled={!canEdit} onChange={(event) => setDrafts((current) => ({ ...current, [group.id]: { ...draft, title: event.target.value } }))} /></label>
            <label className="is-order"><span>Порядок</span><input type="number" value={draft.sortOrder} disabled={!canEdit} onChange={(event) => setDrafts((current) => ({ ...current, [group.id]: { ...draft, sortOrder: Number(event.target.value) } }))} /></label>
            <button className="is-visibility" type="button" disabled={!canEdit} aria-pressed={draft.isVisible} onClick={() => setDrafts((current) => ({ ...current, [group.id]: { ...draft, isVisible: !draft.isVisible } }))}>{draft.isVisible ? <Eye size={16} /> : <EyeOff size={16} />} {draft.isVisible ? "Виден" : "Скрыт"}</button>
            <button className="is-save" type="button" disabled={!canEdit || !changed || busyId !== null || draft.title.trim().length < 2} onClick={() => void save(group.id)}>{busyId === group.id ? <LoaderCircle className="is-spinning" size={16} /> : <Save size={16} />} Сохранить</button>
            {canDelete ? <button className={deleteId === group.id ? "is-delete is-confirm" : "is-delete"} type="button" disabled={busyId !== null} onClick={() => void remove(group.id)}><Trash2 size={15} /> {deleteId === group.id ? "Удалить точно" : "Удалить"}</button> : null}
          </article>;
        })}
      </div>
    </dialog>
  </>;
}
