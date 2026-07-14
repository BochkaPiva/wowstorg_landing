import { lazy, Suspense, useEffect } from "react";
import { useLenis } from "@shared/lib/useLenis";
import { Hero } from "@widgets/hero/Hero";
import { DinoStory } from "@widgets/dino-story/DinoStory";
import { LeadForm } from "@widgets/lead-form/LeadForm";
import { Faq } from "@widgets/landing-sections/Faq";
import { Footer } from "@widgets/landing-sections/Footer";
import { FormatIndex } from "@widgets/landing-sections/FormatIndex";
import { TrustMarquee } from "@widgets/landing-sections/TrustMarquee";
import { CasesShowcase } from "@widgets/landing-sections/CasesShowcase";
import { CookieConsent } from "@widgets/legal/CookieConsent";
import { LegalModalProvider } from "@widgets/legal/LegalModal";
import { CatalogGateway } from "@widgets/catalog-gateway/CatalogGateway";
import { CatalogCartProvider } from "@features/catalog-cart/CatalogCartContext";
import { SiteContentProvider, useSiteContent } from "@features/site-content/SiteContentContext";

const CatalogPage = lazy(() => import("@widgets/catalog-page/CatalogPage").then((module) => ({ default: module.CatalogPage })));
const AdminPage = lazy(() => import("@widgets/admin-page/AdminPage").then((module) => ({ default: module.AdminPage })));

function RouteLoader() {
  return <div className="route-loader" role="status" aria-live="polite"><span>Загружаем</span></div>;
}

function LandingPage() {
  useLenis();
  const { content } = useSiteContent();

  useEffect(() => {
    const seo = content.seo;
    document.title = seo.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = seo.description;
  }, [content.seo]);

  return (
    <main className="page-shell">
      <Hero />
      <TrustMarquee />
      <FormatIndex />
      <CatalogGateway />
      <CasesShowcase />
      <DinoStory />
      <Faq />
      <LeadForm />
      <Footer />
    </main>
  );
}

export default function App() {
  const pathname = window.location.pathname.replace(/\/$/, "");
  const isCatalogPage = pathname === "/catalog";
  const isAdminPage = pathname === "/admin";

  useEffect(() => {
    const canonicalUrl = isCatalogPage
      ? "https://www.wowstorg.ru/catalog"
      : "https://www.wowstorg.ru/";
    const robotsContent = isAdminPage
      ? "noindex,nofollow,noarchive"
      : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";

    document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", canonicalUrl);
    document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((link) => {
      link.href = canonicalUrl;
    });
    document.querySelector<HTMLMetaElement>('meta[name="robots"]')?.setAttribute("content", robotsContent);
    document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute("content", canonicalUrl);
  }, [isAdminPage, isCatalogPage]);

  if (isAdminPage) return <Suspense fallback={<RouteLoader />}><AdminPage /></Suspense>;

  return <SiteContentProvider>
    <LegalModalProvider>
      <CatalogCartProvider>
        {isCatalogPage ? <Suspense fallback={<RouteLoader />}><CatalogPage /></Suspense> : <LandingPage />}
        <CookieConsent />
      </CatalogCartProvider>
    </LegalModalProvider>
  </SiteContentProvider>;
}
