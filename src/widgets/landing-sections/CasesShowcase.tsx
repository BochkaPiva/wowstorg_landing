import { ArrowLeft, ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loadPreviewContent } from "@features/admin-content/localDraftRepository";

export function CasesShowcase() {
  const content = loadPreviewContent().cases;
  const caseCollections = content.collections;
  const [selectedCollectionIndex, setSelectedCollectionIndex] = useState<number | null>(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const selectedCollection = selectedCollectionIndex === null ? null : caseCollections[selectedCollectionIndex];
  const selectedProject = selectedCollection && selectedProjectIndex !== null
    ? selectedCollection.projects[selectedProjectIndex]
    : null;
  const isDialogOpen = selectedCollectionIndex !== null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const setPageScrollLocked = (isLocked: boolean) => {
      document.documentElement.classList.toggle("has-open-dialog", isLocked);
      window.dispatchEvent(new CustomEvent("wowstorg:scroll-lock", { detail: isLocked }));
    };

    if (isDialogOpen) {
      if (!dialog.open) dialog.showModal();
      setPageScrollLocked(true);
    } else {
      if (dialog.open) dialog.close();
      setPageScrollLocked(false);
    }

    return () => {
      if (isDialogOpen) setPageScrollLocked(false);
    };
  }, [isDialogOpen]);

  const openCollection = (index: number) => {
    setSelectedProjectIndex(null);
    setSelectedCollectionIndex(index);
  };

  const close = () => {
    setSelectedProjectIndex(null);
    setSelectedCollectionIndex(null);
  };

  return (
    <section className="cases-showcase" id="cases">
      <header className="cases-showcase__head">
        <div>
          <p>{content.eyebrow}</p>
          <h2>{content.title}</h2>
        </div>
        <span>{content.description}</span>
      </header>

      <div className="cases-showcase__rail">
        {caseCollections.map((item, index) => (
          <button className="case-request" key={item.title} type="button" onClick={() => openCollection(index)}>
            <span className="case-request__number">0{index + 1}</span>
            <div className={`case-request__poster case-request__poster--${index + 1}`} aria-hidden="true">
              <strong>{item.code}</strong>
            </div>
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
            <span className="case-request__action">Смотреть кейсы <ArrowUpRight size={17} /></span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        className="case-dialog"
        onCancel={(event) => { event.preventDefault(); close(); }}
        onClose={close}
        onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
      >
        {selectedCollection ? (
          <div className="case-dialog__panel">
            <button className="case-dialog__close" type="button" onClick={close} aria-label="Закрыть портфолио">
              <X size={22} />
            </button>

            <div className="case-dialog__viewport" data-lenis-prevent>
              {selectedProject ? (
                <article className="case-detail">
                <button className="case-detail__back" type="button" onClick={() => setSelectedProjectIndex(null)}>
                  <ArrowLeft size={18} /> Все кейсы направления
                </button>

                <header className="case-detail__head">
                  <span>{selectedCollection.title} · {selectedProject.number}</span>
                  <h2>{selectedProject.title}</h2>
                  <p>{selectedProject.lead}</p>
                </header>

                <div className="case-detail__gallery" aria-label="Фотографии проекта">
                  {selectedProject.gallery?.length ? selectedProject.gallery.map((image) => (
                    <figure key={image.src}>
                      <img src={image.src} alt={image.alt} />
                    </figure>
                  )) : (
                    <>
                      <div className="case-detail__media case-detail__media--lead"><span>Главное фото</span></div>
                      <div className="case-detail__media"><span>Фото 02</span></div>
                      <div className="case-detail__media"><span>Фото 03</span></div>
                    </>
                  )}
                </div>

                <div className="case-detail__story">
                  <div>
                    <span>О проекте</span>
                    <ol>
                      {selectedProject.facts.map((fact, index) => <li key={fact}><small>0{index + 1}</small>{fact}</li>)}
                    </ol>
                  </div>
                  <div>
                    <span>Результат</span>
                    <p>{selectedProject.result}</p>
                  </div>
                </div>

                <a className="case-dialog__cta" href="#brief" onClick={close}>Обсудить похожий проект <ArrowUpRight size={18} /></a>
                </article>
              ) : (
                <div className="case-portfolio">
                <header className="case-portfolio__head">
                  <span>Портфолио направления</span>
                  <h2>{selectedCollection.title}</h2>
                  <p>Выберите проект, чтобы посмотреть задачу, фотографии, механику и результат.</p>
                </header>

                <nav className="case-portfolio__tabs" aria-label="Направления портфолио">
                  {caseCollections.map((collection, index) => (
                    <button
                      className={index === selectedCollectionIndex ? "is-active" : ""}
                      key={collection.title}
                      type="button"
                      onClick={() => openCollection(index)}
                    >
                      {collection.title}
                    </button>
                  ))}
                </nav>

                <div className="case-portfolio__grid">
                  {selectedCollection.projects.map((project, index) => (
                    <button className="portfolio-card" key={project.number} type="button" onClick={() => setSelectedProjectIndex(index)}>
                      <div className={`portfolio-card__media portfolio-card__media--${selectedCollectionIndex! + 1}`}>
                        {project.cover ? <img src={project.cover} alt="" /> : <span>{project.number}</span>}
                        <small>Материалы готовятся</small>
                      </div>
                      <span>{project.meta}</span>
                      <h3>{project.title}</h3>
                      <div>Открыть кейс <ArrowUpRight size={17} /></div>
                    </button>
                  ))}
                </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </dialog>
    </section>
  );
}
