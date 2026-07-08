import { Reveal } from "@shared/ui/Reveal";

export function Statement() {
  return (
    <section className="section statement" id="statement">
      <div className="section-inner statement__grid">
        <Reveal>
          <h2 className="section-title text-balance">
            ВАУСТОРГ превращает корпоративные задачи в{" "}
            <span className="purple">игровые события</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.12} className="statement__copy">
          <p>
            Мы собираем механику, реквизит, ведущих и визуальную подачу в единый сценарий:
            от камерного тимбилдинга до большой бренд-зоны на городском событии.
          </p>
          <div className="statement__signal">
            <span>Игра</span>
            <span>Технология</span>
            <span>Вау-эффект</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
