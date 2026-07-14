import { navigationItems, siteConfig } from "@shared/config/site";
import { useSiteContent } from "@features/site-content/SiteContentContext";

export function Footer() {
  const { content: previewContent } = useSiteContent();
  const footerHeading = previewContent.footer.heading.split(" ");
  const footerHeadingBreak = Math.max(1, Math.ceil(footerHeading.length / 2));

  return (
    <footer className="site-footer">
      <div className="site-footer__stage">
        <div className="site-footer__closing">
          <span>Ивент-агентство · {previewContent.contacts.city}</span>
          <h2>{footerHeading.slice(0, footerHeadingBreak).join(" ")}<br />{footerHeading.slice(footerHeadingBreak).join(" ")}</h2>
          <p>{previewContent.footer.description}</p>
        </div>
        <div className="site-footer__visual" aria-hidden="true">
          <img
            src="/footer-dino.webp"
            alt=""
            width="1400"
            height="788"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="site-footer__body">
        <div className="site-footer__contacts">
          <span>Связаться напрямую</span>
          {previewContent.contacts.phones.map((phone) => <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a>)}
          <a href={`mailto:${previewContent.contacts.email}`}>{previewContent.contacts.email}</a>
        </div>

        <div className="site-footer__location">
          <span>Работаем</span>
          <strong>{previewContent.contacts.city}</strong>
          <p>{previewContent.footer.locationDescription}</p>
        </div>

        <nav className="site-footer__nav" aria-label="Нижняя навигация">
          <span>На сайте</span>
          {navigationItems.map((item) => <a key={item.label} href={item.href}>{item.label}</a>)}
          <a href="#brief">Оставить заявку</a>
        </nav>
      </div>

      <div className="site-footer__legal">
        <span>© 2026 {siteConfig.brandName}</span>
        <div>
          <a href="/privacy.html">Конфиденциальность</a>
          <a href="/personal-data-consent.html">Согласие на обработку данных</a>
          <a href="/cookies.html">Файлы cookie</a>
        </div>
        <a href="#top">Наверх ↑</a>
      </div>
    </footer>
  );
}
