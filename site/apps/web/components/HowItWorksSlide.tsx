import Slide from "./Slide";
import styles from "./HowItWorksSlide.module.css";
import {
  howItWorksColumns,
  howItWorksEyebrow,
  howItWorksHeading,
} from "@/content/howItWorks";

export default function HowItWorksSlide() {
  return (
    <Slide id="how-it-works">
      <p className="eyebrow">{howItWorksEyebrow}</p>
      <h2>{howItWorksHeading}</h2>
      <div className={styles.columns}>
        {howItWorksColumns.map((column) => (
          <div className={styles.column} key={column.title}>
            <h3 className={styles.columnTitle}>{column.title}</h3>
            <div className={styles.steps}>
              {column.steps.map((step, i) => (
                <div className={styles.step} key={step.title}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <div>
                    <h4 className={styles.stepTitle}>{step.title}</h4>
                    <p className={styles.stepBody}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}
