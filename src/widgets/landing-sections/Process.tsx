import { ClipboardList, Cuboid, Flag, Users } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const steps = [
  ["Разбираем задачу", "Формат, площадка, аудитория, длительность, ограничения и желаемый эффект.", ClipboardList],
  ["Собираем механику", "Подбираем игры, сценарий, роли персонала и логику перемещения гостей.", Cuboid],
  ["Готовим площадку", "Привозим реквизит, собираем зоны, проверяем безопасность и тайминг.", Flag],
  ["Проводим событие", "Ведущие и игротехники управляют процессом, а гости просто включаются в игру.", Users],
];

export function Process() {
  return (
    <section className="section process">
      <div className="section-inner">
        <Reveal>
          <div className="split-head">
            <h2 className="section-title">Как проходит работа</h2>
            <p className="section-copy">
              Держим процесс понятным: от первой задачи до последнего раунда на площадке.
            </p>
          </div>
        </Reveal>
        <div className="process-grid">
          {steps.map(([title, text, Icon], index) => (
            <Reveal key={title as string} delay={index * 0.06}>
              <article className="process-step">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon size={25} aria-hidden="true" />
                <h3>{title as string}</h3>
                <p>{text as string}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
