import Slide from "./Slide";
import { GITHUB_URL } from "@/content/navigation";

export default function HeroSlide() {
  return (
    <Slide id="overview">
      <p className="eyebrow">Non-custodial · Built on Stellar</p>
      <h1>A recurring payment that lives in your wallet, not in anyone&apos;s promise</h1>
      <p className="lead">
        Set an amount, a recipient, and a schedule, once. Your wallet
        authorizes every charge inside that rule, and nothing outside it,
        even if the other side is compromised. Cancelling is always your
        call, and it&apos;s immediate.
      </p>
      <div className="row">
        <a className="btn" href="#waitlist">
          Join the waitlist
        </a>
        <a className="link" href={GITHUB_URL} target="_blank" rel="noopener">
          View the code
        </a>
      </div>
    </Slide>
  );
}
