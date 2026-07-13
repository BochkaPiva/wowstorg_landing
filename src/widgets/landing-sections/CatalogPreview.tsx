import { ArrowRight, Boxes, Goal, Sparkles, Wrench } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const catalogGroups = [
  {
    icon: Goal,
    title: "Игровые станции",
    text: "Короткие активности для потока гостей, командных раундов и свободного перемещения по площадке.",
    cta: "Подобрать станции",
  },
  {
    icon: Boxes,
    title: "Реквизит",
    text: "Гигантские игры, брендируемые элементы, оборудование и предметы, которые делают зону заметной.",
    cta: "Смотреть реквизит",
  },
  {
    icon: Sparkles,
    title: "Пакеты под событие",
    text: "Готовые связки для корпоратива, выставки, фестиваля, промо-активации или тимбилдинга.",
    cta: "Собрать пакет",
  },
  {
    icon: Wrench,
    title: "Сценарий и команда",
    text: "Ведущие, игротехники, логистика, тайминг, брендирование и адаптация механики под задачу.",
    cta: "Обсудить механику",
  },
];

export function CatalogPreview() {
  return (
    <section className="section catalog-preview" id="catalog">
      <div className="section-inner">
        <Reveal>
          <div className="catalog-preview__header">
            <h2 className="section-title">Каталог, который помогает выбрать формат</h2>
            <p className="section-copy">
              Это не витрина ради витрины. Каталог будет работать как подборщик механик:
              по задаче, площадке, количеству гостей и нужному эффекту.
            </p>
          </div>
        </Reveal>

        <div className="catalog-preview__grid">
          {catalogGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <Reveal key={group.title} delay={index * 0.05}>
                <article className="catalog-item">
                  <Icon size={24} aria-hidden="true" />
                  <h3>{group.title}</h3>
                  <p>{group.text}</p>
                  <a href="#contacts">
                    {group.cta}
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
