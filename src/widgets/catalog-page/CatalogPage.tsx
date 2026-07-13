import { ArrowLeft, ArrowRight, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCatalogCart } from "@features/catalog-cart/CatalogCartContext";

const catalogSections = [
  { id: "team", title: "Тимбилдинги", description: "Готовые командные программы со сценарием, механиками и общим финалом." },
  { id: "welcome", title: "Welcome-зоны", description: "Решения для встречи гостей, общения и мягкого включения в событие." },
  { id: "spaces", title: "Игровые зоны", description: "Комплектные игровые пространства для корпоративов, выставок и фестивалей." },
  { id: "props", title: "Реквизит", description: "Отдельные оцифрованные позиции для аренды и комплектации площадки." },
] as const;

function CartDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { items, totalQuantity, removeItem, setQuantity, clearCart } = useCatalogCart();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="catalog-cart" onCancel={onClose} onClose={onClose}>
      <header>
        <div><span>Ваша подборка</span><strong>{totalQuantity || "Пока пусто"}</strong></div>
        <button type="button" onClick={onClose} aria-label="Закрыть корзину"><X size={22} /></button>
      </header>

      {items.length ? (
        <>
          <div className="catalog-cart__items">
            {items.map((item) => (
              <article key={item.id}>
                <div><span>{item.section}</span><strong>{item.title}</strong></div>
                <div className="catalog-cart__quantity" aria-label={`Количество: ${item.title}`}>
                  <button type="button" onClick={() => setQuantity(item.id, item.quantity - 1)} aria-label="Уменьшить количество"><Minus size={15} /></button>
                  <span>{item.quantity}</span>
                  <button type="button" onClick={() => setQuantity(item.id, item.quantity + 1)} aria-label="Увеличить количество"><Plus size={15} /></button>
                </div>
                <button type="button" onClick={() => removeItem(item.id)}>Удалить</button>
              </article>
            ))}
          </div>
          <div className="catalog-cart__footer">
            <button type="button" onClick={clearCart}>Очистить</button>
            <a href="/#brief">Прикрепить к заявке <ArrowRight size={18} /></a>
          </div>
        </>
      ) : (
        <div className="catalog-cart__empty">
          <ShoppingBag size={28} strokeWidth={1.5} />
          <strong>Здесь появится состав события</strong>
          <p>Добавляйте пакеты и реквизит. Подборка сохранится и прикрепится к заявке.</p>
          <button type="button" onClick={onClose}>Продолжить смотреть</button>
        </div>
      )}
    </dialog>
  );
}

export function CatalogPage() {
  const initialSection = new URLSearchParams(window.location.search).get("section");
  const [activeSection, setActiveSection] = useState(catalogSections.some((section) => section.id === initialSection) ? initialSection! : "team");
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { totalQuantity } = useCatalogCart();
  const active = catalogSections.find((section) => section.id === activeSection) ?? catalogSections[0];

  useEffect(() => {
    document.title = `${active.title} — каталог ВАУСТОРГ`;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", `${active.description} Каталог event-агентства ВАУСТОРГ в Омске.`);
  }, [active]);

  const chooseSection = (id: string) => {
    setActiveSection(id);
    const url = new URL(window.location.href);
    url.searchParams.set("section", id);
    window.history.replaceState({}, "", url);
  };

  return (
    <main className="catalog-page">
      <nav className="catalog-page__nav" aria-label="Навигация каталога">
        <a className="catalog-page__brand" href="/">ВАУСТОРГ</a>
        <a className="catalog-page__back" href="/"><ArrowLeft size={17} /> На главную</a>
        <button className="catalog-page__cartButton" type="button" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} /> Корзина <span>{totalQuantity}</span>
        </button>
      </nav>

      <header className="catalog-page__hero">
        <p>Каталог решений и реквизита</p>
        <h1>Соберите событие <span>в одном месте.</span></h1>
        <div>
          <p>Начните с готового формата или выберите отдельные позиции. Корзина сохранит состав и передаст его вместе с заявкой.</p>
          <a href="/#brief">Обсудить задачу <ArrowRight size={18} /></a>
        </div>
      </header>

      <section className="catalog-page__workspace" aria-labelledby="catalog-section-title">
        <div className="catalog-page__toolbar">
          <div className="catalog-page__sections" role="tablist" aria-label="Разделы каталога">
            {catalogSections.map((section, index) => (
              <button key={section.id} id={`catalog-tab-${section.id}`} type="button" role="tab" aria-controls="catalog-panel" aria-selected={section.id === activeSection} className={section.id === activeSection ? "is-active" : ""} onClick={() => chooseSection(section.id)}>
                <span>0{index + 1}</span>{section.title}
              </button>
            ))}
          </div>
          <label className="catalog-page__search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Поиск по каталогу</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти формат или реквизит" />
          </label>
        </div>

        <div id="catalog-panel" className="catalog-page__empty" role="tabpanel" aria-labelledby={`catalog-tab-${active.id}`}>
          <div>
            <span>{active.title}</span>
            <h2 id="catalog-section-title">Пока здесь пусто.</h2>
            <p>{query ? `По запросу «${query}» пока нет опубликованных позиций.` : "Карточки раздела готовятся к публикации. Уже сейчас можем собрать решение вручную под задачу, гостей и площадку."}</p>
            <a href="/#brief">Получить подборку вручную <ArrowRight size={18} /></a>
          </div>
          <div className="catalog-page__emptyCard" aria-hidden="true"><span>ВАУСТОРГ / {active.title}</span><strong>Скоро</strong></div>
        </div>
      </section>

      <CartDialog open={cartOpen} onClose={() => setCartOpen(false)} />
    </main>
  );
}
