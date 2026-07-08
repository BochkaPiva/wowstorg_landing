import { CircleDot } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const games = [
  ["Гигантские игры", "Большой реквизит, который быстро собирает внимание гостей и хорошо работает в свободном формате."],
  ["Баланс и ловкость", "Задания на координацию, скорость реакции и командное взаимодействие без долгих инструкций."],
  ["Спортивные станции", "Динамичные зоны для зачёта, турнирной сетки или коротких командных раундов."],
  ["Настольные механики", "Компактные игры для помещений, переговорных зон, вечеринок и камерных встреч."],
  ["Промо-зоны", "Активности с брендированием, сбором внимания и понятным действием для участника."],
  ["Кастомные игры", "Собираем механику под тему события, продукт, внутренний запуск или обучающий сценарий."],
];

export function Games() {
  return (
    <section className="section" id="games">
      <div className="section-inner">
        <Reveal>
          <div className="split-head">
            <h2 className="section-title">Игровые направления</h2>
            <p className="section-copy">
              От быстрых станций до больших игровых зон: каждая активность получает понятную
              задачу, роль ведущего и способ вовлечения.
            </p>
          </div>
        </Reveal>
        <div className="game-grid">
          {games.map(([title, text], index) => (
            <Reveal key={title} delay={index * 0.04}>
              <article className="game-card">
                <CircleDot size={18} aria-hidden="true" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
