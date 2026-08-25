import styles from "./BrandGraphic.module.css";

type Variant = "overview" | "waitlist";

type Point = { x: number; y: number; r: number; accent?: boolean };
type Graphic = { ring: { x: number; y: number; r: number }; dots: Point[]; edges: [number, number][] };

/** edge endpoints: -1 refers to the ring center, 0+ indexes into `dots` */
const GRAPHICS: Record<Variant, Graphic> = {
  overview: {
    ring: { x: 230, y: 150, r: 30 },
    dots: [
      { x: 70, y: 70, r: 3 },
      { x: 150, y: 50, r: 3 },
      { x: 300, y: 90, r: 4, accent: true },
      { x: 90, y: 220, r: 3 },
      { x: 270, y: 260, r: 4, accent: true },
      { x: 180, y: 320, r: 3 },
      { x: 330, y: 340, r: 3 },
    ],
    edges: [
      [-1, 2],
      [-1, 3],
      [0, 1],
      [1, -1],
      [4, 5],
      [5, 6],
      [3, 4],
    ],
  },
  waitlist: {
    ring: { x: 200, y: 180, r: 30 },
    dots: [
      { x: 90, y: 90, r: 3 },
      { x: 310, y: 110, r: 4, accent: true },
      { x: 320, y: 280, r: 3 },
      { x: 100, y: 290, r: 4, accent: true },
    ],
    edges: [
      [-1, 0],
      [-1, 1],
      [-1, 2],
      [-1, 3],
    ],
  },
};

export default function BrandGraphic({ variant }: { variant: Variant }) {
  const g = GRAPHICS[variant];
  const point = (i: number) => (i === -1 ? g.ring : g.dots[i]);

  return (
    <svg
      className={styles.svg}
      viewBox="0 0 360 420"
      aria-hidden="true"
      focusable="false"
    >
      {g.edges.map(([a, b], i) => {
        const p1 = point(a);
        const p2 = point(b);
        return (
          <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} className={styles.edge} />
        );
      })}
      <circle cx={g.ring.x} cy={g.ring.y} r={g.ring.r} className={styles.ring} />
      {g.dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          className={d.accent ? styles.dotAccent : styles.dot}
        />
      ))}
    </svg>
  );
}
