import { Reveal } from "@shared/ui/Reveal";

const steps = [
  [
    "Гость замечает объект",
    "Крупный реквизит или яркая станция становится точкой притяжения без длинных объяснений.",
  ],
  [
    "Понимает действие",
    "Правила считываются быстро: попробовать, попасть, собрать, пройти или обыграть команду.",
  ],
  [
    "Включается в игру",
    "Ведущий держит темп, а механика дает понятный результат, эмоцию и повод остаться в зоне.",
  ],
  [
    "Уносит впечатление",
    "Финальный момент превращается в фото, обсуждение, командный результат или контакт с брендом.",
  ],
];

export function WowMechanic() {
  return (
    <section className="section wow-mechanic">
      <div className="section-inner wow-mechanic__inner">
        <Reveal>
          <h2 className="section-title">
            Вау-эффект появляется не от декора, а от действия
          </h2>
        </Reveal>

        <div className="wow-mechanic__timeline">
          {steps.map(([title, text], index) => (
            <Reveal key={title} delay={index * 0.06}>
              <article className="wow-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
