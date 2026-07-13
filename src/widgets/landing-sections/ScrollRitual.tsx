import { Reveal } from "@shared/ui/Reveal";

const frames = [
  ["01", "Гость замечает", "Крупный объект, свет, звук или ведущий создают точку притяжения."],
  ["02", "Подходит ближе", "Правила считываются за секунды: что сделать, куда попасть, с кем сыграть."],
  ["03", "Включается", "Механика дает азарт, понятный результат и повод остаться в зоне."],
  ["04", "Уносит историю", "Фото, командный счет, приз, контакт с брендом или общий финальный момент."],
];

export function ScrollRitual() {
  return (
    <section className="scroll-ritual">
      <div className="scroll-ritual__sticky">
        <Reveal>
          <span className="chapter-kicker">Сценарий вовлечения</span>
          <h2>Вау-эффект рождается в движении, а не в декоре.</h2>
        </Reveal>
      </div>

      <div className="scroll-ritual__frames">
        {frames.map(([number, title, text]) => (
          <Reveal key={title}>
            <article>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
