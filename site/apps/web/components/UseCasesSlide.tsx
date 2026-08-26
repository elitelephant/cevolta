import Slide from "./Slide";
import styles from "./UseCasesSlide.module.css";
import {
  useCases,
  useCasesEyebrow,
  useCasesHeading,
} from "@/content/useCases";

export default function UseCasesSlide() {
  return (
    <Slide id="use-cases">
      <p className="eyebrow">{useCasesEyebrow}</p>
      <h2>{useCasesHeading}</h2>
      <div className={styles.columns}>
        {useCases.map((useCase) => (
          <div className={styles.column} key={useCase.title}>
            <h3 className={styles.columnTitle}>{useCase.title}</h3>
            <p className={styles.columnBody}>{useCase.description}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
