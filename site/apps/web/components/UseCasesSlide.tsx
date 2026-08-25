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
      <div className={styles.grid}>
        {useCases.map((useCase) => (
          <div className={styles.item} key={useCase.title}>
            <h4 className={styles.title}>{useCase.title}</h4>
            <p className={styles.body}>{useCase.description}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
