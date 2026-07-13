import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const items = [
  {
    title: "Гигантские игры",
    text: "Большие объекты для первого вау-контакта и фото.",
    tone: "hot",
  },
  {
    title: "Станции на ловкость",
    text: "Короткие раунды, которые быстро включают гостей.",
    tone: "cold",
  },
  {
    title: "Бренд-зоны",
    text: "Механики, в которых продукт становится частью действия.",
    tone: "gold",
  },
  {
    title: "Командные сценарии",
    text: "Связка игр, ведущих и финала под задачу компании.",
    tone: "deep",
  },
];

export function CatalogTheater() {
  return (
    <section className="catalog-theater" id="catalog">
      <div className="catalog-theater__head">
        <Reveal>
          <span className="chapter-kicker">Каталог</span>
          <h2>Не витрина реквизита. Конструктор впечатления.</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p>
            Каталог станет точкой входа в подбор формата: площадка, количество гостей,
            бюджет, темп, брендирование и нужный эффект. Сначала смысл, потом предметы.
          </p>
        </Reveal>
      </div>

      <div className="catalog-theater__grid">
        {items.map((item, index) => (
          <Reveal key={item.title} delay={index * 0.05}>
            <article className={`catalog-tile catalog-tile--${item.tone}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <a href="#contacts">
                Подобрать <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
