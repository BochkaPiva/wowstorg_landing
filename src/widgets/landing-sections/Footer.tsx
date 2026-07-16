import { navigationItems, siteConfig } from "@shared/config/site";
import { useSiteContent } from "@features/site-content/SiteContentContext";
import { LegalLink } from "@widgets/legal/LegalModal";

export function Footer() {
  const { content: previewContent } = useSiteContent();
  const footerHeading = previewContent.footer.heading.split(" ");
  const footerHeadingBreak = Math.max(1, Math.ceil(footerHeading.length / 2));

  return (
    <footer className="site-footer" id="contacts">
      <div className="site-footer__stage">
        <div className="site-footer__closing">
          <span>Организация мероприятий · {previewContent.contacts.city}</span>
          <h2>{footerHeading.slice(0, footerHeadingBreak).join(" ")}<br />{footerHeading.slice(footerHeadingBreak).join(" ")}</h2>
          <p>{previewContent.footer.description}</p>
        </div>
        <div className="site-footer__visual" aria-hidden="true">
          <img
            src="/footer-dino.webp"
            srcSet="/footer-dino-480.webp 480w, /footer-dino-800.webp 800w, /footer-dino.webp 1400w"
            sizes="(max-width: 720px) 100vw, 55vw"
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
          <a href="#contacts">Контакты</a>
          <a href="#brief">Оставить заявку</a>
        </nav>
      </div>

      <div className="site-footer__legal">
        <span>© 2026 {siteConfig.brandName}</span>
        <div>
          <LegalLink document="privacy">Конфиденциальность</LegalLink>
          <LegalLink document="personalData">Согласие на обработку данных</LegalLink>
          <LegalLink document="cookies">Файлы cookie</LegalLink>
        </div>
        <a href="#top">Наверх ↑</a>
      </div>
    </footer>
  );
}
