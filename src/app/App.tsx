import { useLenis } from "@shared/lib/useLenis";
import { Hero } from "@widgets/hero/Hero";
import { FinalCta } from "@widgets/landing-sections/FinalCta";
import { Footer } from "@widgets/landing-sections/Footer";
import { Formats } from "@widgets/landing-sections/Formats";
import { Games } from "@widgets/landing-sections/Games";
import { Process } from "@widgets/landing-sections/Process";
import { Statement } from "@widgets/landing-sections/Statement";
import { UseCases } from "@widgets/landing-sections/UseCases";

export default function App() {
  useLenis();

  return (
    <main className="page-shell">
      <Hero />
      <Statement />
      <Formats />
      <Games />
      <UseCases />
      <Process />
      <FinalCta />
      <Footer />
    </main>
  );
}
