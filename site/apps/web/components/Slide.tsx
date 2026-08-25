import styles from "./Slide.module.css";

export default function Slide({
  id,
  last = false,
  visual,
  children,
}: {
  id: string;
  last?: boolean;
  visual?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={last ? `${styles.slide} ${styles.slideLast}` : styles.slide}
    >
      <div className={styles.card}>
        {visual ? (
          <div className={`${styles.inner} ${styles.innerWithVisual}`}>
            <div className={styles.content}>{children}</div>
            <div className={styles.visual}>{visual}</div>
          </div>
        ) : (
          <div className={styles.inner}>{children}</div>
        )}
      </div>
    </section>
  );
}
