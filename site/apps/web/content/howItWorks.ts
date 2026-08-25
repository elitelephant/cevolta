export type Step = {
  title: string;
  description: string;
};

export type HowItWorksColumn = {
  title: string;
  steps: Step[];
};

export const howItWorksEyebrow = "How it works";
export const howItWorksHeading = "One rule. Money moves in, or moves out.";

export const howItWorksColumns: HowItWorksColumn[] = [
  {
    title: "For getting paid",
    steps: [
      {
        title: "Set the rule",
        description: "Amount, currency, and frequency. No code needed, just share a link.",
      },
      {
        title: "Get paid every cycle",
        description: "Funds land straight in your wallet. No one else custodies or holds them. Not even Cevolta.",
      },
      {
        title: "See status live",
        description: "Who's active, who cancelled, straight from the registry. No spreadsheets.",
      },
    ],
  },
  {
    title: "For paying on autopilot",
    steps: [
      {
        title: "Set the rule in your wallet",
        description: "Amount, recipient, cadence. The only authorization you'll ever give.",
      },
      {
        title: "Charges happen inside the rule",
        description: "Your wallet authorizes each one within those limits. Nothing outside them, even if the other side is compromised. You don't sign every cycle.",
      },
      {
        title: "Cancel whenever you want",
        description: "One click, effective immediately. The other side can't block it or delay it.",
      },
    ],
  },
];
