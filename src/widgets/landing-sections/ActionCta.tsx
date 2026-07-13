import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@shared/config/site";

export function ActionCta() {
  return (
    <section className="action-cta" id="contacts">
      <div className="action-cta__noise" aria-hidden="true" />
      <div className="action-cta__inner">
        <span>Омск / выездные проекты</span>
        <h2>Дайте нам задачу. Мы соберем событие, которое невозможно просто “посетить”.</h2>
        <a href={`mailto:${siteConfig.contactEmail}`}>
          Обсудить проект <ArrowUpRight size={20} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
