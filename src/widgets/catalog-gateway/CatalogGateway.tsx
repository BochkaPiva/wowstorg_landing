import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useSiteContent } from "@features/site-content/SiteContentContext";

export function CatalogGateway() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();
  const { content: siteContent } = useSiteContent();
  const content = siteContent.catalogGateway;
  const catalogSections = content.sections;
  const active = catalogSections[activeIndex];
  if (!active) return null;
  const catalogHref = `/catalog?section=${active.id}`;

  return (
    <section className="catalog-gateway" id="catalog">
      <header className="catalog-gateway__head">
        <div>
          <p>{content.eyebrow}</p>
          <h2>{content.title} <span>{content.accent}</span></h2>
        </div>
        <div>
          <p>{content.description}</p>
          <a href="/catalog">{content.ctaLabel} <ArrowUpRight size={17} /></a>
        </div>
      </header>

      <div className="catalog-gateway__browser">
        <div className="catalog-gateway__tabs" role="tablist" aria-label="Разделы будущего каталога">
          {catalogSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={activeIndex === index}
              className={activeIndex === index ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
            >
              <span>{section.index}</span>{section.tab}
            </button>
          ))}
        </div>

        <div className="catalog-gateway__viewport">
          <AnimatePresence mode="wait">
            <motion.article
              key={active.id}
              className="catalog-gateway__copy"
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              role="tabpanel"
            >
              <span className="catalog-gateway__sectionNumber">{active.index} / {String(catalogSections.length).padStart(2, "0")}</span>
              <h3>{active.title}</h3>
              <strong>{active.subtitle}</strong>
              <p>{active.description}</p>
              <a className="catalog-gateway__action" href={catalogHref}>Смотреть раздел <ArrowUpRight size={18} /></a>
            </motion.article>
          </AnimatePresence>

          <div className="catalog-gateway__stack">
            <div className="catalog-sheet catalog-sheet--back" aria-hidden="true">
              <span>ВАУСТОРГ / ЦИФРОВОЙ КАТАЛОГ</span>
            </div>
            <div className="catalog-sheet catalog-sheet--middle" aria-hidden="true">
              <span>Пакеты выше</span><strong>Реквизит внутри</strong>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className={`catalog-sheet catalog-sheet--front catalog-sheet--${active.id}`}
                initial={reducedMotion ? false : { opacity: 0, x: 28, rotate: 2 }}
                animate={{ opacity: 1, x: 0, rotate: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, x: -24, rotate: -2 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="catalog-sheet__top"><span>{active.index}</span><small>КАТЕГОРИЯ</small></div>
                <strong>{active.tab}</strong>
                <a className="catalog-sheet__bottom" href={catalogHref}><span>Смотреть раздел</span><ArrowUpRight size={20} /></a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
