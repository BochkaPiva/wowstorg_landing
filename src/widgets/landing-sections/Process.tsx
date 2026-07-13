import { ClipboardList, Cuboid, Flag, Users } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const steps = [
  {
    icon: ClipboardList,
    title: "Разбираем задачу",
    text: "Формат, площадка, аудитория, длительность, ограничения и желаемый эффект.",
  },
  {
    icon: Cuboid,
    title: "Собираем механику",
    text: "Подбираем игры, сценарий, роли персонала и логику перемещения гостей.",
  },
  {
    icon: Flag,
    title: "Готовим площадку",
    text: "Привозим реквизит, собираем зоны, проверяем безопасность и тайминг.",
  },
  {
    icon: Users,
    title: "Ведем событие",
    text: "Команда держит темп, а гости включаются в игру без лишних инструкций.",
  },
];

export function Process() {
  return (
    <section className="section production" id="process">
      <div className="section-inner production__inner">
        <Reveal className="production__title">
          <h2 className="section-title">Премиальный эффект держится на точной подготовке</h2>
        </Reveal>

        <div className="production-map">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.title} delay={index * 0.06}>
                <article className="production-step">
                  <Icon size={22} aria-hidden="true" />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
