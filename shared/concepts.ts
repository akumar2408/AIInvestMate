export type Concept = {
  term: string;
  short: string;
  description: string;
  aliases?: string[];
};

export const concepts: Concept[] = [
  {
    term: "DCA",
    short: "Dollar-cost averaging",
    description:
      "Investing a fixed amount on a regular cadence regardless of price to reduce timing risk and build discipline.",
    aliases: ["Dollar-cost averaging", "DCA"]
  },
  {
    term: "Envelope budgeting",
    short: "Cash every dollar job",
    description:
      "Assign every dollar to a category-specific envelope so that fixed costs, goals, and fun money stay within guardrails.",
    aliases: ["envelope", "envelopes"]
  },
  {
    term: "ETF",
    short: "Exchange-traded fund",
    description:
      "A basket of securities that trades like a stock and typically tracks an index. Watch fees (expense ratio) and diversification.",
    aliases: ["exchange traded fund"]
  },
  {
    term: "Expense ratio",
    short: "Annual operating cost",
    description:
      "The percentage a fund charges yearly to cover management fees. Lower is generally better for long-term investors.",
    aliases: ["fees", "expense ratios"]
  },
  {
    term: "DCA schedule",
    short: "Automated investing plan",
    description:
      "A recurring investment plan that transfers the same amount into your portfolio on autopilot (e.g., every payday).",
    aliases: ["dca plan"]
  },
  {
    term: "HYSA",
    short: "High-yield savings account",
    description:
      "FDIC-insured cash account that pays higher interest than a standard savings account—great for emergency funds.",
    aliases: ["high yield savings"]
  },
  {
    term: "Emergency fund",
    short: "Cash safety net",
    description:
      "3–6 months of essential expenses saved in a liquid account to cushion job loss or surprises.",
    aliases: ["emergency savings"]
  }
];
