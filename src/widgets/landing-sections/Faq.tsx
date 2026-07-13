import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Reveal } from "@shared/ui/Reveal";
import { loadPreviewContent } from "@features/admin-content/localDraftRepository";

export function Faq() {
  const content = loadPreviewContent().faq;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section faq-section" id="faq">
      <div className="section-inner faq-section__inner">
        <Reveal>
          <h2 className="section-title">{content.title}</h2>
        </Reveal>

        <div className="faq-list">
          {content.items.map(({ question, answer }, index) => {
            const open = openIndex === index;
            const answerId = `faq-answer-${index}`;
            return (
              <Reveal key={question} delay={index * 0.04}>
                <article className={`faq-item ${open ? "is-open" : ""}`}>
                  <button
                    className="faq-item__trigger"
                    type="button"
                    aria-expanded={open}
                    aria-controls={answerId}
                    onClick={() => setOpenIndex(open ? null : index)}
                  >
                    <span>{question}</span>
                    <span className="faq-item__icon" aria-hidden="true"><Plus size={20} /></span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open ? (
                      <motion.div
                        id={answerId}
                        className="faq-item__answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      >
                        <p>{answer}</p>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
