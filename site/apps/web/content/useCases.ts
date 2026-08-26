export type UseCase = {
  title: string;
  description: string;
};

export const useCasesEyebrow = "Use cases";
export const useCasesHeading = "The same rule, from both sides";

export const useCases: UseCase[] = [
  {
    title: "How rent works when neither of you has to think about it",
    description:
      "When you moved in, your landlord didn't want to think about rent every month any more than you did, so you agreed on an amount and a day and set it up once, from your wallet. Since then, neither of you has had to bring it up again. It lands in their wallet on schedule, no transfer to double check. And when you move out, you won't need their permission to stop it. You'll just do it, and they'll see the change the moment it happens.",
  },
  {
    title: "How money gets home without a transfer in the middle",
    description:
      "Every month you send a fixed amount home, and for a while that meant picking a day, opening an app, and hoping the transfer cleared before your mother needed it. Now you set the amount and the day once, from your wallet to hers, and the sending itself disappeared. It's just there on the day it's supposed to be, no service taking a cut, no bank sitting on it for two days first.",
  },
];
