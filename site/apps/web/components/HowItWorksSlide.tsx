import { Fragment } from "react";
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
      {/* DOM stays flow-grouped (each column in full) so mobile, where the
          grid placement below is inert, still reads as a plain list. */}
      <div className={styles.diagram}>
        {howItWorksColumns.map((column, colIndex) => (
          <Fragment key={column.title}>
            <h3
              className={`${styles.flowLabel} ${
                colIndex === 0 ? styles.flowLabelTop : styles.flowLabelBottom
              }`}
              style={{ gridRow: colIndex === 0 ? 1 : 5 }}
            >
              {column.title}
            </h3>
            {column.steps.map((step, i) => (
              <div
                className={`${styles.cell} ${
                  colIndex === 0 ? styles.cellTop : styles.cellBottom
                }`}
                style={{ gridRow: colIndex === 0 ? 2 : 4, gridColumn: i + 1 }}
                key={step.title}
              >
                <p className={styles.stepNum}>{i + 1}</p>
                <h4 className={styles.stepTitle}>{step.title}</h4>
                <p className={styles.stepBody}>{step.description}</p>
              </div>
            ))}
          </Fragment>
        ))}
        <div className={styles.line} aria-hidden="true">
          <span className={styles.tick} />
          <span className={styles.tick} />
          <span className={styles.tick} />
        </div>
      </div>
    </Slide>
  );
}
