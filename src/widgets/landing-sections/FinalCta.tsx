import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

export function FinalCta() {
  return (
    <section className="section final-cta" id="contacts">
      <div className="section-inner">
        <Reveal>
          <div className="final-cta__box">
            <Sparkles size={30} aria-hidden="true" />
            <h2>Хотите, чтобы гости не просто пришли, а включились?</h2>
            <p>
              Опишите задачу — предложим формат, который подойдёт под вашу площадку, бюджет и
              аудиторию.
            </p>
            <div className="hero__actions">
              <a className="button-primary" href="mailto:hello@wowstorg.ru">
                Обсудить проект <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="button-secondary" href="#games">
                Получить подборку игр
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
