import { useSiteContent } from "@features/site-content/SiteContentContext";
import { resolvePublicMediaUrl } from "@shared/lib/publicMedia";

export function TrustMarquee() {
  const { content: siteContent } = useSiteContent();
  const content = siteContent.trust;
  const row = [...content.items, ...content.items];
  if (!content.items.length) return null;

  return (
    <section className="trust-marquee" aria-label="Форматы событий ВАУСТОРГ">
      <div className="trust-marquee__label">{content.label}</div>
      <div className="trust-marquee__track" aria-hidden="true">
        <div className="trust-marquee__row">
          {row.map((brand, index) => {
            const imageUrl = resolvePublicMediaUrl(brand.imagePath);
            const content = imageUrl
              ? <img src={imageUrl} alt={brand.name} loading="lazy" decoding="async" />
              : <span>{brand.name}</span>;

            return brand.href
              ? <a key={`${brand.name}-${index}`} href={brand.href} target="_blank" rel="noreferrer" aria-label={brand.name}>{content}</a>
              : <div key={`${brand.name}-${index}`} className="trust-marquee__item">{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
}
