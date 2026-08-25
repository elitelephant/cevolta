import Slide from "./Slide";
import WaitlistForm from "./WaitlistForm";

export default function WaitlistSlide() {
  return (
    <Slide id="waitlist" last>
      <p className="eyebrow">Waitlist</p>
      <h2>Get an email when Cevolta opens on Testnet</h2>
      <p className="lead">No spam, never more than one email.</p>
      <WaitlistForm />
    </Slide>
  );
}
