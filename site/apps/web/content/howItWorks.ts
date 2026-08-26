export type Step = {
  title: string;
  description: string;
};

export type HowItWorksColumn = {
  title: string;
  steps: Step[];
};

export const howItWorksEyebrow = "How it works";
export const howItWorksHeading = "Set it once. Money moves in, or moves out.";

export const howItWorksColumns: HowItWorksColumn[] = [
  {
    title: "For getting paid",
    steps: [
      {
        title: "Set it up",
        description: "Amount, currency, frequency. Share a link.",
      },
      {
        title: "Paid, every cycle",
        description: "Funds land straight in your wallet.",
      },
      {
        title: "Live status",
        description: "Who's in, who's out, from the chain.",
      },
    ],
  },
  {
    title: "For paying on autopilot",
    steps: [
      {
        title: "Set it up, once",
        description: "Amount, recipient, cadence. The only permission you give.",
      },
      {
        title: "Charged, on schedule",
        description: "Only inside the limits you set. Nothing outside them.",
      },
      {
        title: "Cancel anytime",
        description: "One click. No one else can block it.",
      },
    ],
  },
];
