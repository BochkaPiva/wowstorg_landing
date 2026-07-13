import { useEffect } from "react";
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
import { CatalogGateway } from "@widgets/catalog-gateway/CatalogGateway";
import { CatalogPage } from "@widgets/catalog-page/CatalogPage";
import { CatalogCartProvider } from "@features/catalog-cart/CatalogCartContext";
import { AdminPage } from "@widgets/admin-page/AdminPage";
import { loadPreviewContent } from "@features/admin-content/localDraftRepository";

function LandingPage() {
  useLenis();

  useEffect(() => {
    const seo = loadPreviewContent().seo;
    document.title = seo.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = seo.description;
  }, []);

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

  if (isAdminPage) return <AdminPage />;

  return (
    <CatalogCartProvider>
      {isCatalogPage ? <CatalogPage /> : <LandingPage />}
      <CookieConsent />
    </CatalogCartProvider>
  );
}
