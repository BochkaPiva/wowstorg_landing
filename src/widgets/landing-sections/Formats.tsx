import { Puzzle, Sparkles, Trophy, Wrench } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const formats = [
  {
    icon: Trophy,
    title: "Тимбилдинги",
    text: "Командные игры с ясной целью, динамикой и финальным вау-моментом.",
  },
  {
    icon: Sparkles,
    title: "Корпоративные интерактивы",
    text: "Игровые станции, активности и соревновательные зоны для событий любого масштаба.",
  },
  {
    icon: Wrench,
    title: "Аренда реквизита",
    text: "Готовые игры, оборудование и промо-реквизит для событий, выставок и праздников.",
  },
  {
    icon: Puzzle,
    title: "Индивидуальные проекты",
    text: "Кастомные механики, брендированные игры и нестандартные сценарии под задачу клиента.",
  },
];

export function Formats() {
  return (
    <section className="section section--surface" id="formats">
      <div className="section-inner">
        <Reveal>
          <div className="section-head">
            <h2 className="section-title">Форматы мероприятий</h2>
            <p className="section-copy">
              Подбираем формат под площадку, аудиторию и темп события, а не наоборот.
            </p>
          </div>
        </Reveal>

        <div className="format-grid">
          {formats.map((format, index) => {
            const Icon = format.icon;
            return (
              <Reveal key={format.title} delay={index * 0.05}>
                <article className="format-card">
                  <div className="format-card__icon">
                    <Icon size={23} aria-hidden="true" />
                  </div>
                  <h3>{format.title}</h3>
                  <p>{format.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
