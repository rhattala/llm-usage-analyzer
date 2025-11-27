import { UsageReport, AnalysisResult, TokenUsage } from "../types";

// Pricing table (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "o1-preview": { input: 15.0, output: 60.0 },
  // Default/Fallback
  "default": { input: 5.0, output: 20.0 }
};

export const calculateAnalysis = (report: UsageReport): AnalysisResult => {
  let apiCost = 0;
  const modelBreakdown: Array<{ name: string; value: number }> = [];

  // Calculate API cost based on specific models used
  Object.entries(report.usage.tokens.by_model).forEach(([modelName, tokens]) => {
    // Find pricing or fallback to default
    const pricing = MODEL_PRICING[modelName] || MODEL_PRICING["default"];
    
    const costForModel = 
      (tokens.input / 1_000_000) * pricing.input + 
      (tokens.output / 1_000_000) * pricing.output;
    
    apiCost += costForModel;

    modelBreakdown.push({
      name: modelName.split('-').slice(0, 3).join('-'), // Shorten name
      value: tokens.input + tokens.output
    });
  });

  // If no detailed model data, use aggregate with blended rate
  if (Object.keys(report.usage.tokens.by_model).length === 0) {
    const pricing = MODEL_PRICING["default"];
    apiCost = 
      (report.usage.tokens.input / 1_000_000) * pricing.input + 
      (report.usage.tokens.output / 1_000_000) * pricing.output;
      
      modelBreakdown.push({ name: 'Aggregate', value: report.usage.tokens.input + report.usage.tokens.output });
  }

  const currentCost = report.plan.price_usd;
  const isOverpaying = currentCost > apiCost;
  const savings = Math.abs(currentCost - apiCost);

  let recommendedPlan = "API (Pay-As-You-Go)";
  if (!isOverpaying && currentCost < apiCost * 0.8) {
    recommendedPlan = "Keep Current Subscription";
  } else if (!isOverpaying) {
    recommendedPlan = "Subscription (Good Value)";
  }

  return {
    currentMonthlyCost: currentCost,
    apiEquivalentCost: parseFloat(apiCost.toFixed(2)),
    savings: parseFloat(savings.toFixed(2)),
    isOverpaying,
    recommendedPlan,
    modelBreakdown
  };
};

export const formatTokenNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toString();
};
