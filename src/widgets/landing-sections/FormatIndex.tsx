import { loadPreviewContent } from "@features/admin-content/localDraftRepository";

export function FormatIndex() {
  const content = loadPreviewContent().formats;

  return (
    <section className="format-index" id="formats">
      <div className="format-index__intro">
        <div>
          <p>{content.eyebrow}</p>
          <h2>{content.title}</h2>
        </div>
        <p className="format-index__summary">{content.summary}</p>
      </div>

      <div className="format-index__list" id="catalog-preview">
        {content.items.map((format, index) => (
          <article key={format.title} className="format-row">
            <span className="format-row__index">0{index + 1}</span>
            <h3>{format.title}</h3>
            <p>{format.text}</p>
            <span className="format-row__note">{format.note}</span>
          </article>
        ))}
      </div>
      <div className="format-index__catalogNote">
        <p>{content.catalogNote}</p>
        <a href="/catalog">{content.catalogCtaLabel}</a>
      </div>
    </section>
  );
}
