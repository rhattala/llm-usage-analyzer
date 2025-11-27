// Shared types for CLI - mirrors main app types

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

export interface ClaudeMessage {
  parentUuid?: string;
  sessionId?: string;
  message?: {
    model?: string;
    role?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
      service_tier?: string;
    };
  };
  timestamp?: string;
}

export interface ScanOptions {
  days?: number;
  startDate?: string;
  endDate?: string;
  output?: string;
  json?: boolean;
  verbose?: boolean;
}

export interface AnalyzeOptions {
  plan?: string;
  price?: number;
  verbose?: boolean;
}
