import { UsageReport, AnalysisResult, TokenUsage } from "../types";
import { PLAN_LIMITS, PlanLimitKey } from "../constants";

// Pricing table (per 1M tokens) - Updated Nov 2024
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic - Current models
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-opus-4-20250514": { input: 15.0, output: 75.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-5-haiku-20241022": { input: 0.80, output: 4.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  // Claude estimated (from web export) - assume Sonnet pricing
  "Claude (estimated)": { input: 3.0, output: 15.0 },
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "o1": { input: 15.0, output: 60.0 },
  "o1-preview": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 3.0, output: 12.0 },
  // Google Gemini
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
  "gemini-2.5-flash": { input: 0.15, output: 0.60 },
  "gemini-2.0-flash": { input: 0.10, output: 0.40 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.30 },
  "Gemini (estimated)": { input: 1.25, output: 10.0 },
  // xAI Grok
  "grok-3": { input: 5.0, output: 15.0 },
  "grok-3-mini": { input: 0.30, output: 0.50 },
  "grok-2": { input: 2.0, output: 10.0 },
  "Grok (estimated)": { input: 5.0, output: 15.0 },
  // Default/Fallback - use Sonnet pricing as reasonable default
  "default": { input: 3.0, output: 15.0 }
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

// Plan Fit Analysis Types
export interface PlanFitResult {
  peakMessages: number;
  peakDate: string;
  avgMessages: number;
  totalMessages: number;
  totalDays: number;
  daysOverPro: number;      // Days > 100 messages
  daysOverMax5x: number;    // Days > 500 messages
  daysOverMax20x: number;   // Days > 2000 messages
  dailyUsage: Array<{ date: string; count: number; isOverPro: boolean; isOverMax5x: boolean; isOverMax20x: boolean }>;
  recommendation: 'pro' | 'max5x' | 'max20x';
  recommendationReason: string;
  currentPlan: string;
  currentPrice: number;
  recommendedPrice: number;
  savings: number;          // Monthly savings if downgrade possible
  confidence: 'high' | 'medium' | 'low'; // Based on data completeness
}

/**
 * Analyze usage data to determine the best plan fit
 * Key insight: Claude plans limit by MESSAGE COUNT per day, not tokens
 */
export function analyzePlanFit(data: UsageReport, currentPlan?: PlanLimitKey): PlanFitResult {
  const byDay = data.usage.messages.by_day;

  // Calculate daily message counts
  const dailyUsage = byDay.map(day => ({
    date: day.date,
    count: day.count,
    isOverPro: day.count > PLAN_LIMITS['Claude Pro'].messagesPerDay,
    isOverMax5x: day.count > PLAN_LIMITS['Claude Max 5x'].messagesPerDay,
    isOverMax20x: day.count > PLAN_LIMITS['Claude Max 20x'].messagesPerDay,
  }));

  // Find peak usage
  const peakDay = dailyUsage.reduce((max, day) =>
    day.count > max.count ? day : max,
    { date: '', count: 0, isOverPro: false, isOverMax5x: false, isOverMax20x: false }
  );

  // Count days over each threshold
  const daysOverPro = dailyUsage.filter(d => d.isOverPro).length;
  const daysOverMax5x = dailyUsage.filter(d => d.isOverMax5x).length;
  const daysOverMax20x = dailyUsage.filter(d => d.isOverMax20x).length;

  // Calculate averages
  const totalMessages = dailyUsage.reduce((sum, d) => sum + d.count, 0);
  const totalDays = dailyUsage.length;
  const avgMessages = totalDays > 0 ? Math.round(totalMessages / totalDays) : 0;

  // Determine recommendation
  let recommendation: 'pro' | 'max5x' | 'max20x';
  let recommendationReason: string;

  if (daysOverMax5x > 0) {
    // If any day exceeded 500 messages, need Max 20x
    recommendation = 'max20x';
    recommendationReason = `You exceeded 500 messages on ${daysOverMax5x} day${daysOverMax5x > 1 ? 's' : ''}. Max 20x is required to avoid rate limits.`;
  } else if (peakDay.count >= 400) {
    // If peak is close to 500 (within 20% buffer), recommend staying on Max 5x but warn
    recommendation = 'max5x';
    recommendationReason = `Your peak (${peakDay.count} msgs) is close to the 500/day limit. Max 5x is safe, but watch your usage.`;
  } else if (daysOverPro > 0) {
    // Exceeded Pro limits but under Max 5x
    recommendation = 'max5x';
    recommendationReason = `You exceeded 100 messages on ${daysOverPro} day${daysOverPro > 1 ? 's' : ''}. Max 5x gives you comfortable headroom.`;
  } else if (peakDay.count >= 80) {
    // Close to Pro limits
    recommendation = 'max5x';
    recommendationReason = `Your peak (${peakDay.count} msgs) is approaching Pro's 100/day limit. Max 5x recommended for safety.`;
  } else {
    // Under all limits comfortably
    recommendation = 'pro';
    recommendationReason = `Your usage (peak: ${peakDay.count} msgs/day) fits comfortably within Pro's 100/day limit.`;
  }

  // Calculate savings based on current plan
  const detected = currentPlan || (data.plan.name as PlanLimitKey) || 'Claude Max 20x';
  const detectedInfo = PLAN_LIMITS[detected] || PLAN_LIMITS['Claude Max 20x'];
  const recommendedInfo = PLAN_LIMITS[`Claude ${recommendation === 'pro' ? 'Pro' : recommendation === 'max5x' ? 'Max 5x' : 'Max 20x'}` as PlanLimitKey];

  const currentPrice = detectedInfo.price;
  const recommendedPrice = recommendedInfo.price;
  const savings = currentPrice - recommendedPrice;

  // Confidence level based on data completeness
  let confidence: 'high' | 'medium' | 'low';
  if (totalDays >= 30) {
    confidence = 'high';
  } else if (totalDays >= 14) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  return {
    peakMessages: peakDay.count,
    peakDate: peakDay.date,
    avgMessages,
    totalMessages,
    totalDays,
    daysOverPro,
    daysOverMax5x,
    daysOverMax20x,
    dailyUsage,
    recommendation,
    recommendationReason,
    currentPlan: detected,
    currentPrice,
    recommendedPrice,
    savings: Math.max(0, savings), // Only show positive savings
    confidence,
  };
}
