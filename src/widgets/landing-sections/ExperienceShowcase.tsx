import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Circle, MousePointer2, RadioTower, Sparkles } from "lucide-react";
import { Reveal } from "@shared/ui/Reveal";

const modes = [
  {
    icon: MousePointer2,
    title: "Поймать внимание",
    text: "Гость видит объект, понимает действие и сам подходит к зоне.",
  },
  {
    icon: RadioTower,
    title: "Разогнать поток",
    text: "Ведущие, станции и реквизит держат ритм без очередей и хаоса.",
  },
  {
    icon: Sparkles,
    title: "Оставить след",
    text: "Финал превращается в фото, командный результат или контакт с брендом.",
  },
];

export function ExperienceShowcase() {
  const reduced = useReducedMotion();

  return (
    <section className="experience-showcase" id="formats">
      <div className="experience-showcase__stage">
        <Reveal className="experience-showcase__copy">
          <span className="chapter-kicker">Event-агентство в Омске</span>
          <h2>
            Мы строим не программу вечера, а игровое поле, в которое хочется зайти
            самому.
          </h2>
          <p>
            ВАУСТОРГ собирает корпоративы, тимбилдинги, интерактивные зоны и
            реквизит так, чтобы гостю не объясняли настроение. Он видит действие,
            пробует и остается внутри события.
          </p>
          <a href="#contacts">
            Собрать механику <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </Reveal>

        <div className="experience-showcase__visual" aria-hidden="true">
          <motion.div
            className="orbital orbital--one"
            animate={reduced ? undefined : { rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          >
            <Circle size={9} />
          </motion.div>
          <motion.div
            className="orbital orbital--two"
            animate={reduced ? undefined : { rotate: -360 }}
            transition={{ duration: 36, repeat: Infinity, ease: "linear" }}
          >
            <Circle size={7} />
          </motion.div>
          <div className="experience-showcase__core">
            <span>WOW</span>
            <small>игра как магнит</small>
          </div>
        </div>
      </div>

      <div className="experience-showcase__modes">
        {modes.map((mode, index) => {
          const Icon = mode.icon;
          return (
            <Reveal key={mode.title} delay={index * 0.06}>
              <article>
                <Icon size={22} aria-hidden="true" />
                <h3>{mode.title}</h3>
                <p>{mode.text}</p>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
