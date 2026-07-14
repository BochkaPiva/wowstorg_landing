import { ArrowLeft, ArrowRight, Check, Clock3, Minus, Plus, Search, ShoppingBag, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCatalogCart } from "@features/catalog-cart/CatalogCartContext";
import {
  type CatalogCategory,
  type CatalogItemRecord,
  listCatalogCategories,
  listCatalogItems,
} from "@features/catalog-data/catalogRepository";

const sectionOrder: CatalogCategory["id"][] = ["teambuilding", "welcome", "game_zone", "props"];

function formatRange(min: number | null, max: number | null, suffix: string) {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min}–${max} ${suffix}`;
  return `${min ?? max} ${suffix}`;
}

function CatalogPoster({ item, compact = false }: { item: CatalogItemRecord; compact?: boolean }) {
  const cover = item.media[0];
  if (cover) return <img src={cover.src} alt={cover.alt} loading="lazy" />;
  return <div className={`catalog-poster catalog-poster--${item.categoryId}`} aria-hidden="true">
    <span>ВАУСТОРГ / {item.kind === "prop" ? "РЕКВИЗИТ" : "РЕШЕНИЕ"}</span>
    <strong>{compact ? item.title.slice(0, 1) : item.title}</strong>
    <small>{String(item.sortOrder || 1).padStart(2, "0")}</small>
  </div>;
}

function CartDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { items, totalQuantity, removeItem, setQuantity, clearCart } = useCatalogCart();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog ref={dialogRef} className="catalog-cart" onCancel={onClose} onClose={onClose}>
    <header><div><span>Ваша подборка</span><strong>{totalQuantity || "Пока пусто"}</strong></div><button type="button" onClick={onClose} aria-label="Закрыть корзину"><X size={22} /></button></header>
    {items.length ? <>
      <div className="catalog-cart__items">{items.map((item) => <article key={item.id}>
        <div><span>{item.section}</span><strong>{item.title}</strong></div>
        <div className="catalog-cart__quantity" aria-label={`Количество: ${item.title}`}>
          <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Уменьшить количество"><Minus size={15} /></button><span>{item.quantity}</span><button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Увеличить количество"><Plus size={15} /></button>
        </div>
        <button type="button" onClick={() => removeItem(item.id)}>Удалить</button>
      </article>)}</div>
      <div className="catalog-cart__footer"><button type="button" onClick={clearCart}>Очистить</button><a href="/#brief">Прикрепить к заявке <ArrowRight size={18} /></a></div>
    </> : <div className="catalog-cart__empty"><ShoppingBag size={28} strokeWidth={1.5} /><strong>Здесь появится состав события</strong><p>Добавляйте пакеты и реквизит. Подборка сохранится и прикрепится к заявке.</p><button type="button" onClick={onClose}>Продолжить смотреть</button></div>}
  </dialog>;
}

function ItemDialog({ item, category, onClose }: { item: CatalogItemRecord | null; category?: CatalogCategory; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, items } = useCatalogCart();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) { setActiveImage(0); dialog.showModal(); }
    if (!item && dialog.open) dialog.close();
  }, [item]);

  if (!item) return <dialog ref={dialogRef} />;
  const inCart = items.some((cartItem) => cartItem.id === item.id);
  const guests = formatRange(item.guestMin, item.guestMax, "гостей");
  const duration = formatRange(item.durationMin, item.durationMax, "минут");

  return <dialog ref={dialogRef} className="catalog-detail" onCancel={onClose} onClose={onClose}>
    <button className="catalog-detail__close" type="button" onClick={onClose} aria-label="Закрыть карточку"><X size={22} /></button>
    <div className="catalog-detail__media">
      {item.media.length ? <img src={item.media[activeImage]?.src} alt={item.media[activeImage]?.alt} /> : <CatalogPoster item={item} />}
      {item.media.length > 1 ? <div className="catalog-detail__thumbs">{item.media.map((media, index) => <button className={index === activeImage ? "is-active" : ""} key={media.id} type="button" aria-label={`Показать фото ${index + 1}`} onClick={() => setActiveImage(index)}><img src={media.src} alt="" /></button>)}</div> : null}
    </div>
    <article className="catalog-detail__copy">
      <span>{category?.title ?? "Каталог"}</span>
      <h2>{item.title}</h2>
      <p className="catalog-detail__lead">{item.shortDescription}</p>
      <div className="catalog-detail__facts">
        {guests ? <span><Users size={18} /> {guests}</span> : null}
        {duration ? <span><Clock3 size={18} /> {duration}</span> : null}
      </div>
      {item.effectStatement ? <blockquote>{item.effectStatement}</blockquote> : null}
      <p>{item.description}</p>
      {item.includedItems.length ? <section><h3>В составе</h3><ul>{item.includedItems.map((value) => <li key={value}><Check size={16} />{value}</li>)}</ul></section> : null}
      {item.requirements.length ? <section><h3>Что учесть</h3><ul>{item.requirements.map((value) => <li key={value}>{value}</li>)}</ul></section> : null}
      <div className="catalog-detail__actions">
        <button type="button" onClick={() => addItem({ id: item.id, title: item.title, section: category?.title ?? "Каталог" })}>{inCart ? "Добавить ещё" : "Добавить в подборку"} <Plus size={18} /></button>
        <a href="/#brief">Обсудить задачу <ArrowRight size={18} /></a>
      </div>
    </article>
  </dialog>;
}

export function CatalogPage() {
  const initialSection = new URLSearchParams(window.location.search).get("section");
  const normalizedInitial = initialSection === "team" ? "teambuilding" : initialSection === "spaces" ? "game_zone" : initialSection;
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [items, setItems] = useState<CatalogItemRecord[]>([]);
  const [activeSection, setActiveSection] = useState<CatalogCategory["id"]>((sectionOrder.includes(normalizedInitial as CatalogCategory["id"]) ? normalizedInitial : "teambuilding") as CatalogCategory["id"]);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItemRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { totalQuantity, addItem, items: cartItems } = useCatalogCart();

  useEffect(() => {
    let active = true;
    Promise.all([listCatalogCategories(), listCatalogItems()]).then(([nextCategories, nextItems]) => {
      if (!active) return;
      setCategories(nextCategories);
      setItems(nextItems);
      setLoading(false);
    }).catch(() => { if (active) { setLoadError(true); setLoading(false); } });
    return () => { active = false; };
  }, []);

  const active = categories.find((section) => section.id === activeSection) ?? { id: activeSection, title: "Каталог", description: "", sortOrder: 0, isVisible: true };
  const visibleItems = useMemo(() => items.filter((item) => {
    if (item.categoryId !== activeSection || item.status !== "published") return false;
    const needle = query.trim().toLocaleLowerCase("ru");
    return !needle || `${item.title} ${item.shortDescription} ${item.badges.join(" ")}`.toLocaleLowerCase("ru").includes(needle);
  }), [activeSection, items, query]);

  useEffect(() => {
    document.title = `${active.title} — каталог ВАУСТОРГ`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${active.description} Каталог event-агентства ВАУСТОРГ в Омске.`);
  }, [active]);

  const chooseSection = (id: CatalogCategory["id"]) => {
    setActiveSection(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", id);
    window.history.replaceState({}, "", url);
  };

  return <main className="catalog-page">
    <nav className="catalog-page__nav" aria-label="Навигация каталога"><a className="catalog-page__brand" href="/">ВАУСТОРГ</a><a className="catalog-page__back" href="/"><ArrowLeft size={17} /> На главную</a><button className="catalog-page__cartButton" type="button" onClick={() => setCartOpen(true)}><ShoppingBag size={18} /> Подборка <span>{totalQuantity}</span></button></nav>
    <header className="catalog-page__hero"><p>Каталог решений и реквизита</p><h1>Соберите событие <span>в одном месте.</span></h1><div><p>Начните с готового формата или выберите отдельные позиции. Подборка сохранит состав и передаст его вместе с заявкой.</p><a href="/#brief">Обсудить задачу <ArrowRight size={18} /></a></div></header>
    <section className="catalog-page__workspace" aria-labelledby="catalog-section-title">
      <div className="catalog-page__toolbar"><div className="catalog-page__sections" role="tablist" aria-label="Разделы каталога">{categories.map((section, index) => <button key={section.id} id={`catalog-tab-${section.id}`} type="button" role="tab" aria-selected={section.id === activeSection} className={section.id === activeSection ? "is-active" : ""} onClick={() => chooseSection(section.id)}><span>0{index + 1}</span>{section.title}</button>)}</div><label className="catalog-page__search"><Search size={18} aria-hidden="true" /><span className="sr-only">Поиск по каталогу</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти формат или реквизит" /></label></div>
      <header className="catalog-page__sectionHead"><div><span>Раздел</span><h2 id="catalog-section-title">{active.title}</h2></div><p>{active.description}</p></header>
      {loading ? <div className="catalog-page__skeleton" aria-label="Загружаем каталог">{[1, 2, 3].map((key) => <span key={key} />)}</div> : null}
      {!loading && loadError ? <div className="catalog-page__notice"><strong>Не удалось загрузить каталог</strong><p>Обновите страницу или оставьте заявку: мы соберём подборку вручную.</p></div> : null}
      {!loading && !loadError && visibleItems.length ? <div className="catalog-page__grid">{visibleItems.map((item, index) => {
        const category = categories.find((entry) => entry.id === item.categoryId);
        const inCart = cartItems.some((cartItem) => cartItem.id === item.id);
        return <article className="catalog-card" key={item.id}>
          <button className="catalog-card__media" type="button" onClick={() => setSelectedItem(item)} aria-label={`Открыть ${item.title}`}><CatalogPoster item={item} /><span>0{index + 1}</span></button>
          <div className="catalog-card__body"><div className="catalog-card__badges">{item.badges.slice(0, 2).map((badge) => <span key={badge}>{badge}</span>)}</div><h3>{item.title}</h3><p>{item.shortDescription}</p><div><button type="button" onClick={() => setSelectedItem(item)}>Подробнее <ArrowRight size={17} /></button><button className={inCart ? "is-added" : ""} type="button" onClick={() => addItem({ id: item.id, title: item.title, section: category?.title ?? "Каталог" })}>{inCart ? "Добавить ещё" : "В подборку"} <Plus size={17} /></button></div></div>
        </article>;
      })}</div> : null}
      {!loading && !loadError && !visibleItems.length ? <div className="catalog-page__notice"><strong>{query ? "Ничего не нашли" : "Раздел готовится"}</strong><p>{query ? "Попробуйте изменить запрос или выбрать соседний раздел." : "Оставьте задачу, и мы соберём решение вручную."}</p><a href="/#brief">Получить подборку <ArrowRight size={18} /></a></div> : null}
    </section>
    <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} />
    <ItemDialog item={selectedItem} category={categories.find((entry) => entry.id === selectedItem?.categoryId)} onClose={() => setSelectedItem(null)} />
  </main>;
}
