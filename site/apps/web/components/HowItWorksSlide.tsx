import Slide from "./Slide";
import styles from "./HowItWorksSlide.module.css";
import type { HowItWorksPanel } from "@/content/howItWorks";

export default function HowItWorksSlide({ panel }: { panel: HowItWorksPanel }) {
  return (
    <Slide id={panel.id}>
      <p className="eyebrow">{panel.eyebrow}</p>
      <h2>{panel.heading}</h2>
      <div className={styles.steps}>
        {panel.steps.map((step, i) => (
          <div className={styles.step} key={step.title}>
            <div className={styles.stepNum}>{i + 1}</div>
            <div>
              <h4 className={styles.stepTitle}>{step.title}</h4>
              <p className={styles.stepBody}>{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}
