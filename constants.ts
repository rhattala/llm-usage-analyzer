import { PlanPricing, UsageReport } from "./types";

export const APP_NAME = "LLM Usage Analyzer";

export const KNOWN_PLANS: PlanPricing[] = [
  {
    name: "Claude Pro",
    provider: "anthropic",
    type: "subscription",
    price_monthly_flat: 20,
  },
  {
    name: "Claude Max",
    provider: "anthropic",
    type: "subscription",
    price_monthly_flat: 100, // Hypothetical tier mentioned in spec
  },
  {
    name: "ChatGPT Plus",
    provider: "openai",
    type: "subscription",
    price_monthly_flat: 20,
  },
  {
    name: "API (Pay-As-You-Go)",
    provider: "various",
    type: "payg",
    // Base pricing for calculation reference (blended average of high-end models)
    pricing_model: {
      input_per_1m: 3.0,
      output_per_1m: 15.0,
    },
  },
];

export const MOCK_DATA: UsageReport = {
  provider: "anthropic",
  source: "demo",
  period: {
    start: "2023-10-01T00:00:00.000Z",
    end: "2023-10-31T23:59:59.000Z",
  },
  plan: {
    name: "Claude Pro",
    price_usd: 20,
    type: "subscription",
  },
  usage: {
    tokens: {
      input: 450000,
      output: 120000,
      cached: 850000,
      by_model: {
        "claude-3-5-sonnet-20240620": { input: 300000, output: 90000 },
        "claude-3-opus-20240229": { input: 50000, output: 10000 },
        "claude-3-haiku-20240307": { input: 100000, output: 20000 },
      },
    },
    messages: {
      count: 145,
      by_day: [
        { date: "2023-10-01", count: 5, input: 15000, output: 2000 },
        { date: "2023-10-02", count: 12, input: 35000, output: 8000 },
        { date: "2023-10-03", count: 8, input: 22000, output: 4000 },
        { date: "2023-10-04", count: 2, input: 5000, output: 1000 },
        { date: "2023-10-05", count: 0, input: 0, output: 0 },
        { date: "2023-10-06", count: 15, input: 45000, output: 12000 },
        { date: "2023-10-07", count: 22, input: 65000, output: 18000 },
        { date: "2023-10-08", count: 4, input: 10000, output: 3000 },
        { date: "2023-10-09", count: 10, input: 28000, output: 6000 },
        { date: "2023-10-10", count: 18, input: 55000, output: 14000 },
        { date: "2023-10-11", count: 6, input: 18000, output: 5000 },
        { date: "2023-10-12", count: 9, input: 25000, output: 7000 },
        { date: "2023-10-13", count: 3, input: 8000, output: 2000 },
        { date: "2023-10-14", count: 0, input: 0, output: 0 },
        { date: "2023-10-15", count: 11, input: 32000, output: 9000 },
      ],
    },
    sessions: {
      count: 24,
    },
  },
};
