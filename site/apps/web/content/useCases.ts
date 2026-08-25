export type UseCase = {
  title: string;
  description: string;
};

export const useCasesEyebrow = "Use cases";
export const useCasesHeading = "The same rule pays for very different things";

export const useCases: UseCase[] = [
  {
    title: "Monthly rent",
    description: "Same amount, same recipient, same day every month.",
  },
  {
    title: "Paying off a purchase in installments",
    description:
      "A fixed amount, on schedule. You're the one who cancels it, not the other way around.",
  },
  {
    title: "An allowance, or money to someone regularly",
    description: "A fixed amount, every week or month, without having to remember.",
  },
  {
    title: "Business tools you pay for monthly",
    description:
      "The software you already pay for every month. Now without a card in the middle.",
  },
];
