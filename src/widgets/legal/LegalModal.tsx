import { X } from "lucide-react";
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useSiteContent } from "@features/site-content/SiteContentContext";

export type LegalDocumentKey = "privacy" | "personalData" | "cookies";

const legalRoutes: Record<LegalDocumentKey, string> = {
  privacy: "/privacy.html",
  personalData: "/personal-data-consent.html",
  cookies: "/cookies.html",
};

type LegalModalContextValue = {
  openLegalDocument: (key: LegalDocumentKey) => void;
};

const LegalModalContext = createContext<LegalModalContextValue | null>(null);

export function LegalModalProvider({ children }: { children: ReactNode }) {
  const { content } = useSiteContent();
  const [activeKey, setActiveKey] = useState<LegalDocumentKey | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const close = useCallback(() => setActiveKey(null), []);
  const openLegalDocument = useCallback((key: LegalDocumentKey) => setActiveKey(key), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeKey) {
      if (!dialog.open) dialog.showModal();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (dialog.open) dialog.close();
  }, [activeKey]);

  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) close();
  };

  const legalDocument = activeKey ? content.legal[activeKey] : null;

  return (
    <LegalModalContext.Provider value={{ openLegalDocument }}>
      {children}
      <dialog
        ref={dialogRef}
        className="legal-modal"
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onClick={handleBackdropClick}
      >
        {legalDocument ? (
          <div className="legal-modal__surface">
            <header className="legal-modal__header">
              <span>Документы ВАУСТОРГ</span>
              <button type="button" onClick={close} aria-label="Закрыть документ">
                <X size={22} aria-hidden="true" />
              </button>
            </header>
            <div className="legal-modal__scroll">
              <div className="legal-modal__intro">
                <h2 id={titleId}>{legalDocument.title}</h2>
                <p>{legalDocument.introduction}</p>
                {legalDocument.status ? <aside>{legalDocument.status}</aside> : null}
              </div>
              <article className="legal-modal__article">
                {legalDocument.sections.map((section, index) => (
                  <section key={`${section.title}-${index}`}>
                    <h3>{section.title}</h3>
                    <p>{section.body}</p>
                  </section>
                ))}
              </article>
              <footer className="legal-modal__revision">{legalDocument.revision}</footer>
            </div>
          </div>
        ) : null}
      </dialog>
    </LegalModalContext.Provider>
  );
}

export function LegalLink({
  document,
  children,
  className,
}: {
  document: LegalDocumentKey;
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(LegalModalContext);

  return (
    <a
      className={className}
      href={legalRoutes[document]}
      onClick={(event) => {
        if (!context || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        context.openLegalDocument(document);
      }}
    >
      {children}
    </a>
  );
}
