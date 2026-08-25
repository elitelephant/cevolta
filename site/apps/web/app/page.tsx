import SiteHeader from "@/components/SiteHeader";
import DotNav from "@/components/DotNav";
import HeroSlide from "@/components/HeroSlide";
import HowItWorksSlide from "@/components/HowItWorksSlide";
import UseCasesSlide from "@/components/UseCasesSlide";
import WaitlistSlide from "@/components/WaitlistSlide";
import SiteFooter from "@/components/SiteFooter";
import { howItWorks } from "@/content/howItWorks";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <DotNav />
      <main>
        <HeroSlide />
        {howItWorks.map((panel) => (
          <HowItWorksSlide key={panel.id} panel={panel} />
        ))}
        <UseCasesSlide />
        <WaitlistSlide />
      </main>
      <SiteFooter />
    </>
  );
}
