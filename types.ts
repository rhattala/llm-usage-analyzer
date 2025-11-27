export interface TokenUsage {
  input: number;
  output: number;
  cached?: number;
  by_model: Record<string, { input: number; output: number }>;
}

export interface UsageReport {
  provider: 'anthropic' | 'openai' | 'google' | 'other';
  source: 'local_agent' | 'browser_extension' | 'api' | 'manual_upload' | 'demo';
  period: {
    start: string; // ISO Date string
    end: string;   // ISO Date string
  };
  plan: {
    name: string;
    price_usd: number;
    type: 'subscription' | 'payg';
  };
  usage: {
    tokens: TokenUsage;
    messages: {
      count: number;
      by_day: Array<{ date: string; count: number; input: number; output: number }>;
    };
    sessions: {
      count: number;
    };
  };
}

export interface PlanPricing {
  name: string;
  provider: string;
  type: 'subscription' | 'payg';
  price_monthly_flat?: number;
  pricing_model?: {
    input_per_1m: number;
    output_per_1m: number;
    // Simple fallback for unknown models
  };
}

export interface AnalysisResult {
  currentMonthlyCost: number;
  apiEquivalentCost: number;
  savings: number;
  isOverpaying: boolean;
  recommendedPlan: string;
  modelBreakdown: Array<{ name: string; value: number }>;
}
