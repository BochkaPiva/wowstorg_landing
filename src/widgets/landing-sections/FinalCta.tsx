import { ArrowRight } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";
import { siteConfig } from "@shared/config/site";

export function FinalCta() {
  return (
    <section className="section final-cta" id="contacts">
      <div className="section-inner final-cta__grid">
        <Reveal>
          <div>
            <span className="chapter-kicker">Заявка</span>
            <h2>Опишите событие, а мы соберем игровую механику под него</h2>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="request-panel">
            <p>
              Напишите, где проходит событие, сколько гостей ожидается и какой эффект нужен:
              вовлечь команду, собрать поток, усилить бренд-зону или добавить вау-момент.
            </p>
            <a className="button-primary" href={`mailto:${siteConfig.contactEmail}`}>
              Обсудить проект <ArrowRight size={18} aria-hidden="true" />
            </a>
            <small>Омск. Корпоративы, тимбилдинги, интерактивные зоны и аренда реквизита.</small>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
