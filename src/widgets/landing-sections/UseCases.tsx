import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const scenarios = [
  {
    title: "Корпоратив",
    image: "linear-gradient(135deg, rgba(255,210,31,.36), rgba(130,72,255,.18))",
    text: "Смешать отделы, запустить азарт и оставить общий финальный момент.",
  },
  {
    title: "Выставка",
    image: "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,210,31,.2))",
    text: "Остановить поток и дать посетителю причину поговорить с брендом.",
  },
  {
    title: "Фестиваль",
    image: "linear-gradient(135deg, rgba(130,72,255,.32), rgba(0,0,0,.1))",
    text: "Сделать заметную зону, которая работает весь день и не требует объяснений.",
  },
];

export function UseCases() {
  return (
    <section className="case-reel" id="cases">
      <Reveal className="case-reel__head">
        <span className="chapter-kicker">Сценарии</span>
        <h2>Один реквизит может быть развлечением. Сценарий делает его событием.</h2>
      </Reveal>

      <div className="case-reel__cards">
        {scenarios.map((scenario, index) => (
          <Reveal key={scenario.title} delay={index * 0.06}>
            <article className="case-slide">
              <div className="case-slide__image" style={{ background: scenario.image }} />
              <div>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{scenario.title}</h3>
                <p>{scenario.text}</p>
                <a href="#contacts">
                  Обсудить формат <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
