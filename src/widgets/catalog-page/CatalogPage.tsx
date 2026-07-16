import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, FileText, Minus, Plus, Search, ShoppingBag, Users, X, ZoomIn } from "lucide-react";
import { type TouchEvent, useEffect, useRef, useState } from "react";
import { useCatalogCart } from "@features/catalog-cart/CatalogCartContext";
import {
  type CatalogCategory,
  type CatalogItemRecord,
  type CatalogPropGroup,
  listCatalogCategories,
  listCatalogPropGroups,
  listPublicCatalogItems,
} from "@features/catalog-data/catalogRepository";
import { siteConfig } from "@shared/config/site";

const sectionOrder: CatalogCategory["id"][] = ["teambuilding", "welcome", "game_zone", "props"];
const propsPageSize = 30;

function formatRange(min: number | null, max: number | null, suffix: string) {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min}–${max} ${suffix}`;
  return `${min ?? max} ${suffix}`;
}

function formatPrice(value: number | null) {
  return value === null ? "Цена по запросу" : `${new Intl.NumberFormat("ru-RU").format(value)} ₽ / сутки`;
}

function paginationItems(current: number, total: number): Array<number | string> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = Array.from(pages).filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const result: Array<number | string> = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push(`ellipsis-${page}`);
    result.push(page);
  });
  return result;
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

function QuantityControl({
  title,
  quantity,
  maxQuantity,
  onChange,
  variant,
}: {
  title: string;
  quantity: number;
  maxQuantity?: number | null;
  onChange: (quantity: number) => void;
  variant: "card" | "detail" | "cart";
}) {
  const decreaseLabel = quantity === 1
    ? `Убрать «${title}» из подборки`
    : `Уменьшить количество «${title}»`;
  const atLimit = maxQuantity !== null && maxQuantity !== undefined && quantity >= maxQuantity;

  return <div className={`catalog-quantity catalog-quantity--${variant}`} role="group" aria-label={`Количество «${title}»`}>
    <button type="button" onClick={() => onChange(quantity - 1)} aria-label={decreaseLabel} title={decreaseLabel}>
      <Minus size={16} aria-hidden="true" />
    </button>
    <output aria-live="polite" aria-atomic="true">{quantity}<span className="sr-only"> шт.</span></output>
    <button type="button" onClick={() => onChange(quantity + 1)} disabled={atLimit} aria-label={atLimit ? `Доступно максимум ${maxQuantity} шт.` : `Увеличить количество «${title}»`} title={atLimit ? `Доступно максимум ${maxQuantity} шт.` : `Увеличить количество «${title}»`}>
      <Plus size={16} aria-hidden="true" />
    </button>
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
        <QuantityControl title={item.title} quantity={item.quantity} maxQuantity={item.maxQuantity} variant="cart" onChange={(quantity) => setQuantity(item.id, quantity)} />
        <button type="button" onClick={() => removeItem(item.id)}>Удалить</button>
      </article>)}</div>
      <div className="catalog-cart__footer"><button type="button" onClick={clearCart}>Очистить</button><a href="/#brief">Прикрепить к заявке <ArrowRight size={18} /></a></div>
    </> : <div className="catalog-cart__empty"><ShoppingBag size={28} strokeWidth={1.5} /><strong>Здесь появится состав события</strong><p>Добавляйте пакеты и реквизит. Подборка сохранится и прикрепится к заявке.</p><button type="button" onClick={onClose}>Продолжить смотреть</button></div>}
  </dialog>;
}

function ItemDialog({ item, category, propGroup, onClose }: { item: CatalogItemRecord | null; category?: CatalogCategory; propGroup?: CatalogPropGroup; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { addItem, items, setQuantity } = useCatalogCart();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (item && !dialog.open) { setActiveImage(0); setLightboxOpen(false); dialog.showModal(); }
    if (!item && dialog.open) dialog.close();
  }, [item]);

  const displayMedia = item?.media ?? [];
  const mediaCount = displayMedia.length;
  const showImage = (index: number) => {
    if (mediaCount < 1) return;
    setActiveImage((index + mediaCount) % mediaCount);
  };
  const showPreviousImage = () => showImage(activeImage - 1);
  const showNextImage = () => showImage(activeImage + 1);
  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };
  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch || mediaCount < 2) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX > 0) showPreviousImage();
    else showNextImage();
  };

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (lightboxOpen && event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        setLightboxOpen(false);
        return;
      }
      if (event.key === "ArrowLeft") showPreviousImage();
      if (event.key === "ArrowRight") showNextImage();
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [activeImage, item, lightboxOpen, mediaCount]);

  if (!item) return <dialog ref={dialogRef} />;
  const cartItem = items.find((entry) => entry.id === item.id);
  const guests = formatRange(item.guestMin, item.guestMax, "гостей");
  const duration = formatRange(item.durationMin, item.durationMax, "минут");

  return <dialog ref={dialogRef} className="catalog-detail" onCancel={(event) => {
    if (lightboxOpen) {
      event.preventDefault();
      setLightboxOpen(false);
      return;
    }
    onClose();
  }} onClose={onClose}>
    <button className="catalog-detail__close" type="button" onClick={onClose} aria-label="Закрыть карточку"><X size={22} /></button>
    <div className="catalog-detail__media">
      <div className="catalog-detail__stage" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {displayMedia.length ? <button className="catalog-detail__imageButton" type="button" onClick={() => setLightboxOpen(true)} aria-label="Увеличить фотографию">
          <img src={displayMedia[activeImage]?.src} alt={displayMedia[activeImage]?.alt} decoding="async" />
          <span><ZoomIn size={16} /> Увеличить</span>
        </button> : <CatalogPoster item={item} />}
        {displayMedia.length > 1 ? <div className="catalog-detail__galleryControls" aria-label="Навигация по фотографиям">
          <button type="button" onClick={showPreviousImage} aria-label="Предыдущая фотография"><ChevronLeft size={21} /></button>
          <span>{activeImage + 1} / {displayMedia.length}</span>
          <button type="button" onClick={showNextImage} aria-label="Следующая фотография"><ChevronRight size={21} /></button>
        </div> : null}
      </div>
      {displayMedia.length > 1 ? <div className="catalog-detail__thumbs">{displayMedia.map((media, index) => <button className={index === activeImage ? "is-active" : ""} key={media.id} type="button" aria-label={`Показать фото ${index + 1}`} onClick={() => setActiveImage(index)}><img src={media.src} alt="" /></button>)}</div> : null}
    </div>
    <article className="catalog-detail__copy">
      <span>{propGroup?.title ?? category?.title ?? "Каталог"}</span>
      <h2>{item.title}</h2>
      <p className="catalog-detail__lead">{item.shortDescription}</p>
      <div className="catalog-detail__facts">
        {guests ? <span><Users size={18} /> {guests}</span> : null}
        {duration ? <span><Clock3 size={18} /> {duration}</span> : null}
      </div>
      {item.effectStatement ? <blockquote>{item.effectStatement}</blockquote> : null}
      <p>{item.description}</p>
      {item.kind !== "prop" && item.presentationUrl ? <a className="catalog-detail__presentation" href={item.presentationUrl} target="_blank" rel="noreferrer"><FileText size={23} /><span><strong>Смотреть презентацию</strong><small>{item.presentationName || "PDF-презентация"}</small></span><ExternalLink size={18} /></a> : null}
      {item.includedItems.length ? <section><h3>В составе</h3><ul>{item.includedItems.map((value) => <li key={value}><Check size={16} />{value}</li>)}</ul></section> : null}
      {item.requirements.length ? <section><h3>Что учесть</h3><ul>{item.requirements.map((value) => <li key={value}>{value}</li>)}</ul></section> : null}
      <div className="catalog-detail__actions">
        {cartItem
          ? <QuantityControl title={item.title} quantity={cartItem.quantity} maxQuantity={item.stockQuantity} variant="detail" onChange={(quantity) => setQuantity(item.id, quantity, item.stockQuantity)} />
          : <button type="button" disabled={item.stockQuantity === 0} onClick={() => addItem({ id: item.id, title: item.title, section: propGroup?.title ?? category?.title ?? "Каталог", maxQuantity: item.stockQuantity })}>{item.stockQuantity === 0 ? "Нет в наличии" : "Добавить в подборку"} {item.stockQuantity === 0 ? null : <Plus size={18} />}</button>}
        <a href="/#brief">Обсудить задачу <ArrowRight size={18} /></a>
      </div>
    </article>
    {lightboxOpen && displayMedia.length ? <div className="catalog-lightbox" role="dialog" aria-modal="true" aria-label={`Фотографии: ${item.title}`} onClick={(event) => {
      if (event.currentTarget === event.target) setLightboxOpen(false);
    }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button className="catalog-lightbox__close" type="button" onClick={() => setLightboxOpen(false)} aria-label="Закрыть увеличенное фото" autoFocus><X size={24} /></button>
      {displayMedia.length > 1 ? <button className="catalog-lightbox__arrow catalog-lightbox__arrow--previous" type="button" onClick={showPreviousImage} aria-label="Предыдущая фотография"><ChevronLeft size={28} /></button> : null}
      <figure><img src={displayMedia[activeImage]?.src} alt={displayMedia[activeImage]?.alt} /><figcaption>{activeImage + 1} / {displayMedia.length}</figcaption></figure>
      {displayMedia.length > 1 ? <button className="catalog-lightbox__arrow catalog-lightbox__arrow--next" type="button" onClick={showNextImage} aria-label="Следующая фотография"><ChevronRight size={28} /></button> : null}
    </div> : null}
  </dialog>;
}

export function CatalogPage() {
  const initialParams = new URLSearchParams(window.location.search);
  const initialSection = initialParams.get("section");
  const normalizedInitial = initialSection === "team" ? "teambuilding" : initialSection === "spaces" ? "game_zone" : initialSection;
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [propGroups, setPropGroups] = useState<CatalogPropGroup[]>([]);
  const [items, setItems] = useState<CatalogItemRecord[]>([]);
  const [activeSection, setActiveSection] = useState<CatalogCategory["id"]>((sectionOrder.includes(normalizedInitial as CatalogCategory["id"]) ? normalizedInitial : "teambuilding") as CatalogCategory["id"]);
  const [activePropGroup, setActivePropGroup] = useState<string | null>(initialParams.get("group"));
  const [page, setPage] = useState(Math.max(1, Number(initialParams.get("page")) || 1));
  const [query, setQuery] = useState(initialParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [totalItems, setTotalItems] = useState(0);
  const [metadataReady, setMetadataReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItemRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { totalQuantity, addItem, setQuantity, items: cartItems } = useCatalogCart();

  useEffect(() => {
    let active = true;
    Promise.all([listCatalogCategories(), listCatalogPropGroups()]).then(([nextCategories, nextPropGroups]) => {
      if (!active) return;
      setCategories(nextCategories);
      setPropGroups(nextPropGroups);
      if (activePropGroup && !nextPropGroups.some((group) => group.slug === activePropGroup)) setActivePropGroup(null);
      setMetadataReady(true);
    }).catch(() => { if (active) { setLoadError(true); setLoading(false); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 280);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section");
      if (sectionOrder.includes(section as CatalogCategory["id"])) setActiveSection(section as CatalogCategory["id"]);
      setActivePropGroup(params.get("group"));
      setPage(Math.max(1, Number(params.get("page")) || 1));
      setQuery(params.get("q") ?? "");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!metadataReady) return;
    let active = true;
    setLoading(true);
    setLoadError(false);
    const propGroupId = activeSection === "props"
      ? propGroups.find((group) => group.slug === activePropGroup)?.id ?? null
      : null;
    void listPublicCatalogItems({
      categoryId: activeSection,
      propGroupId,
      search: debouncedQuery,
      page: activeSection === "props" ? page : 1,
      pageSize: activeSection === "props" ? propsPageSize : undefined,
    }).then((result) => {
      if (!active) return;
      setItems(result.items);
      setTotalItems(result.total);
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
      setLoading(false);
    });
    return () => { active = false; };
  }, [activePropGroup, activeSection, debouncedQuery, metadataReady, page, propGroups]);

  const active = categories.find((section) => section.id === activeSection) ?? { id: activeSection, title: "Каталог", description: "", sortOrder: 0, isVisible: true };
  const isProps = activeSection === "props";
  const totalPages = isProps ? Math.max(1, Math.ceil(totalItems / propsPageSize)) : 1;

  useEffect(() => {
    if (isProps && page > totalPages) setPage(totalPages);
  }, [isProps, page, totalPages]);

  useEffect(() => {
    document.title = `${active.title} - каталог ВАУСТОРГ`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", `${active.description} Каталог агентства мероприятий ВАУСТОРГ в Омске.`);
  }, [active]);

  const replaceUrl = (updates: { section?: CatalogCategory["id"]; group?: string | null; page?: number; query?: string }, push = false) => {
    const url = new URL(window.location.href);
    if (updates.section) url.searchParams.set("section", updates.section);
    if (updates.group === null) url.searchParams.delete("group");
    else if (updates.group) url.searchParams.set("group", updates.group);
    if (updates.page === undefined || updates.page <= 1) url.searchParams.delete("page");
    else url.searchParams.set("page", String(updates.page));
    if (updates.query === undefined || !updates.query.trim()) url.searchParams.delete("q");
    else url.searchParams.set("q", updates.query.trim());
    window.history[push ? "pushState" : "replaceState"]({}, "", url);
  };

  const chooseSection = (id: CatalogCategory["id"]) => {
    setActiveSection(id);
    setActivePropGroup(null);
    setPage(1);
    replaceUrl({ section: id, group: null, page: 1, query });
  };

  const choosePropGroup = (slug: string | null) => {
    setActivePropGroup(slug);
    setPage(1);
    replaceUrl({ section: "props", group: slug, page: 1, query });
  };

  const choosePage = (nextPage: number) => {
    const normalizedPage = Math.min(totalPages, Math.max(1, nextPage));
    setPage(normalizedPage);
    replaceUrl({ section: "props", group: activePropGroup, page: normalizedPage, query }, true);
    document.querySelector(".catalog-page__propFilters")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const firstVisibleItem = isProps && totalItems ? (page - 1) * propsPageSize + 1 : 0;
  const lastVisibleItem = isProps ? Math.min(page * propsPageSize, totalItems) : totalItems;

  return <main className="catalog-page">
    <nav className="catalog-page__nav" aria-label="Навигация каталога"><a className="catalog-page__brand" href="/" aria-label={`На главную — ${siteConfig.brandName}`}><img src="/favicon-32x32.png" width="30" height="30" alt="" /><span>{siteConfig.brandName}</span></a><a className="catalog-page__back" href="/"><ArrowLeft size={17} /> На главную</a><button className="catalog-page__cartButton" type="button" onClick={() => setCartOpen(true)} aria-label={`Открыть подборку, позиций: ${totalQuantity}`}><ShoppingBag size={18} /> Подборка <span aria-live="polite" aria-atomic="true">{totalQuantity}</span></button></nav>
    <header className="catalog-page__hero">
      <p className="catalog-page__heroLabel">Каталог решений и реквизита</p>
      <h1>Соберите событие <span>в одном месте.</span></h1>
      <div className="catalog-page__heroIntro"><p>Начните с готового формата или выберите отдельные позиции. Подборка сохранит состав и передаст его вместе с заявкой.</p><a href="/#brief">Обсудить задачу <ArrowRight size={18} /></a></div>
      <img className="catalog-page__heroDino" src="/catalog-dino.webp" width="748" height="1484" alt="" aria-hidden="true" />
    </header>
    <section className="catalog-page__workspace" aria-labelledby="catalog-section-title">
      <div className="catalog-page__toolbar"><div className="catalog-page__sections" role="tablist" aria-label="Разделы каталога">{categories.map((section, index) => <button key={section.id} id={`catalog-tab-${section.id}`} type="button" role="tab" aria-selected={section.id === activeSection} className={section.id === activeSection ? "is-active" : ""} onClick={() => chooseSection(section.id)}><span>0{index + 1}</span>{section.title}</button>)}</div><label className="catalog-page__search"><Search size={18} aria-hidden="true" /><span className="sr-only">Поиск по каталогу</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); replaceUrl({ section: activeSection, group: activePropGroup, page: 1, query: event.target.value }); }} placeholder="Найти формат или реквизит" /></label></div>
      <header className="catalog-page__sectionHead"><div><span>Раздел</span><h2 id="catalog-section-title">{active.title}</h2></div><p>{active.description}</p></header>
      {isProps ? <div className="catalog-page__propFilters"><div role="group" aria-label="Разделы реквизита"><button className={!activePropGroup ? "is-active" : ""} type="button" aria-pressed={!activePropGroup} onClick={() => choosePropGroup(null)}>Весь реквизит</button>{propGroups.map((group) => <button className={activePropGroup === group.slug ? "is-active" : ""} type="button" aria-pressed={activePropGroup === group.slug} key={group.id} onClick={() => choosePropGroup(group.slug)}>{group.title}</button>)}</div><span aria-live="polite">{totalItems ? `${firstVisibleItem}–${lastVisibleItem} из ${totalItems}` : "0 позиций"}</span></div> : null}
      {loading ? <div className={isProps ? "catalog-page__skeleton catalog-page__skeleton--props" : "catalog-page__skeleton"} aria-label="Загружаем каталог">{Array.from({ length: isProps ? 10 : 3 }, (_, index) => <span key={index} />)}</div> : null}
      {!loading && loadError ? <div className="catalog-page__notice"><strong>Не удалось загрузить каталог</strong><p>Обновите страницу или оставьте заявку: мы соберём подборку вручную.</p></div> : null}
      {!loading && !loadError && items.length ? <div className={isProps ? "catalog-page__grid catalog-page__grid--props" : "catalog-page__grid"}>{items.map((item, index) => {
        const category = categories.find((entry) => entry.id === item.categoryId);
        const propGroup = propGroups.find((group) => group.id === item.propGroupId);
        const cartItem = cartItems.find((entry) => entry.id === item.id);
        const displayIndex = isProps ? (page - 1) * propsPageSize + index + 1 : index + 1;
        const badges = isProps ? [propGroup?.title, ...item.badges].filter(Boolean).slice(0, 2) as string[] : item.badges.slice(0, 2);
        return <article className={isProps ? "catalog-card catalog-card--prop" : "catalog-card"} key={item.id}>
          <button className="catalog-card__media" type="button" onClick={() => setSelectedItem(item)} aria-label={`Открыть ${item.title}`}><CatalogPoster item={item} /><span>{String(displayIndex).padStart(2, "0")}</span></button>
          <div className="catalog-card__body"><div className="catalog-card__badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div><h3>{item.title}</h3><p>{item.shortDescription}</p>{isProps ? <div className="catalog-card__propMeta"><strong>{formatPrice(item.priceFrom)}</strong><span>{item.stockQuantity === null ? "Количество уточняйте" : item.stockQuantity > 0 ? `В наличии: ${item.stockQuantity}` : "Нет в наличии"}</span></div> : null}<div className="catalog-card__actions"><button type="button" onClick={() => setSelectedItem(item)}>Подробнее <ArrowRight size={17} /></button>{cartItem
            ? <QuantityControl title={item.title} quantity={cartItem.quantity} maxQuantity={item.stockQuantity} variant="card" onChange={(quantity) => setQuantity(item.id, quantity, item.stockQuantity)} />
            : <button type="button" disabled={item.stockQuantity === 0} onClick={() => addItem({ id: item.id, title: item.title, section: propGroup?.title ?? category?.title ?? "Каталог", maxQuantity: item.stockQuantity })}>{item.stockQuantity === 0 ? "Нет в наличии" : "В подборку"} {item.stockQuantity === 0 ? null : <Plus size={17} />}</button>}</div></div>
        </article>;
      })}</div> : null}
      {!loading && !loadError && isProps && totalPages > 1 ? <nav className="catalog-page__pagination" aria-label="Страницы реквизита"><button type="button" disabled={page === 1} onClick={() => choosePage(page - 1)} aria-label="Предыдущая страница"><ChevronLeft size={18} /></button>{paginationItems(page, totalPages).map((item) => typeof item === "number" ? <button type="button" className={item === page ? "is-active" : ""} aria-current={item === page ? "page" : undefined} key={item} onClick={() => choosePage(item)}>{item}</button> : <span key={item} aria-hidden="true">…</span>)}<button type="button" disabled={page === totalPages} onClick={() => choosePage(page + 1)} aria-label="Следующая страница"><ChevronRight size={18} /></button></nav> : null}
      {!loading && !loadError && !items.length ? <div className="catalog-page__notice"><strong>{query ? "Ничего не нашли" : activePropGroup ? "В этом разделе пока пусто" : "Раздел готовится"}</strong><p>{query ? "Попробуйте изменить запрос или выбрать соседний раздел." : activePropGroup ? "Посмотрите весь реквизит или выберите другой раздел." : "Оставьте задачу, и мы соберём решение вручную."}</p><a href="/#brief">Получить подборку <ArrowRight size={18} /></a></div> : null}
    </section>
    <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} />
    <ItemDialog item={selectedItem} category={categories.find((entry) => entry.id === selectedItem?.categoryId)} propGroup={propGroups.find((group) => group.id === selectedItem?.propGroupId)} onClose={() => setSelectedItem(null)} />
  </main>;
}
