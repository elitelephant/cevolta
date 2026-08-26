import SiteHeader from "@/components/SiteHeader";
import DotNav from "@/components/DotNav";
import HeroSlide from "@/components/HeroSlide";
import HowItWorksSlide from "@/components/HowItWorksSlide";
import UseCasesSlide from "@/components/UseCasesSlide";
import WaitlistSlide from "@/components/WaitlistSlide";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <DotNav />
      <main>
        <HeroSlide />
        <UseCasesSlide />
        <HowItWorksSlide />
        <WaitlistSlide />
      </main>
      <SiteFooter />
    </>
  );
}
