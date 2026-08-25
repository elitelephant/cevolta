import Slide from "./Slide";
import BrandGraphic from "./BrandGraphic";
import WaitlistForm from "./WaitlistForm";

export default function WaitlistSlide() {
  return (
    <Slide id="waitlist" last visual={<BrandGraphic variant="waitlist" />}>
      <p className="eyebrow">Waitlist</p>
      <h2>Get an email when Cevolta opens on Testnet</h2>
      <p className="lead">No spam, never more than one email.</p>
      <WaitlistForm />
    </Slide>
  );
}
