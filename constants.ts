import { PlanPricing, UsageReport, PlanInfo } from "./types";

export const APP_NAME = "LLM Usage Analyzer";

// Legacy format for backward compatibility
export const KNOWN_PLANS: PlanPricing[] = [
  {
    name: "Claude Pro",
    provider: "anthropic",
    type: "subscription",
    price_monthly_flat: 20,
  },
  {
    name: "Claude Max 5x",
    provider: "anthropic",
    type: "subscription",
    price_monthly_flat: 100,
  },
  {
    name: "Claude Max 20x",
    provider: "anthropic",
    type: "subscription",
    price_monthly_flat: 200,
  },
  {
    name: "ChatGPT Plus",
    provider: "openai",
    type: "subscription",
    price_monthly_flat: 20,
  },
  {
    name: "ChatGPT Pro",
    provider: "openai",
    type: "subscription",
    price_monthly_flat: 200,
  },
  {
    name: "Gemini Advanced",
    provider: "google",
    type: "subscription",
    price_monthly_flat: 20,
  },
  {
    name: "X Premium+ (Grok)",
    provider: "xai",
    type: "subscription",
    price_monthly_flat: 16,
  },
  {
    name: "API (Pay-As-You-Go)",
    provider: "various",
    type: "payg",
    pricing_model: {
      input_per_1m: 3.0,
      output_per_1m: 15.0,
    },
  },
];

// Comprehensive plan database with limits
export const PLANS_DATABASE: PlanInfo[] = [
  // Anthropic Subscription Plans
  {
    name: "Claude Pro",
    provider: "anthropic",
    price_usd: 20,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 100,
      models_included: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-haiku"],
    },
  },
  {
    name: "Claude Max 5x",
    provider: "anthropic",
    price_usd: 100,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 500,
      models_included: ["claude-sonnet-4", "claude-opus-4", "claude-3-5-sonnet", "claude-3-5-haiku"],
    },
  },
  {
    name: "Claude Max 20x",
    provider: "anthropic",
    price_usd: 200,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 2000,
      models_included: ["claude-sonnet-4", "claude-opus-4", "claude-3-5-sonnet", "claude-3-5-haiku"],
    },
  },
  // Anthropic API (PAYG)
  {
    name: "Anthropic API",
    provider: "anthropic",
    price_usd: 0,
    billing: "payg",
    type: "payg",
    pricing: {
      input_per_1m_tokens: 3.0,
      output_per_1m_tokens: 15.0,
      by_model: {
        "claude-opus-4-5-20251101": { input: 15.0, output: 75.0 },
        "claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
        "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
        "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
        "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
        "claude-3-5-haiku-20241022": { input: 0.80, output: 4.0 },
        "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
      },
    },
  },
  // OpenAI Subscription Plans
  {
    name: "ChatGPT Plus",
    provider: "openai",
    price_usd: 20,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 80,
      models_included: ["gpt-4o", "gpt-4o-mini"],
    },
  },
  {
    name: "ChatGPT Pro",
    provider: "openai",
    price_usd: 200,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 1000, // Unlimited in practice
      models_included: ["gpt-4o", "o1", "o1-pro"],
    },
  },
  // OpenAI API (PAYG)
  {
    name: "OpenAI API",
    provider: "openai",
    price_usd: 0,
    billing: "payg",
    type: "payg",
    pricing: {
      input_per_1m_tokens: 2.5,
      output_per_1m_tokens: 10.0,
      by_model: {
        "gpt-4o": { input: 2.5, output: 10.0 },
        "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
        "gpt-4o-mini": { input: 0.15, output: 0.60 },
        "gpt-4-turbo": { input: 10.0, output: 30.0 },
        "gpt-4": { input: 30.0, output: 60.0 },
        "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
        "o1": { input: 15.0, output: 60.0 },
        "o1-mini": { input: 3.0, output: 12.0 },
        "o1-preview": { input: 15.0, output: 60.0 },
      },
    },
  },
  // Google Gemini Plans
  {
    name: "Gemini Advanced",
    provider: "google",
    price_usd: 20,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 100,
      models_included: ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro"],
    },
  },
  {
    name: "Google AI API",
    provider: "google",
    price_usd: 0,
    billing: "payg",
    type: "payg",
    pricing: {
      input_per_1m_tokens: 1.25,
      output_per_1m_tokens: 10.0,
      by_model: {
        "gemini-2.5-pro": { input: 1.25, output: 10.0 },
        "gemini-2.5-flash": { input: 0.15, output: 0.60 },
        "gemini-2.0-flash": { input: 0.10, output: 0.40 },
        "gemini-1.5-pro": { input: 1.25, output: 5.0 },
        "gemini-1.5-flash": { input: 0.075, output: 0.30 },
      },
    },
  },
  // xAI Grok Plans
  {
    name: "X Premium+ (Grok)",
    provider: "other",
    price_usd: 16,
    billing: "monthly",
    type: "subscription",
    limits: {
      estimated_messages_per_day: 100,
      models_included: ["grok-3", "grok-2"],
    },
  },
  {
    name: "xAI API",
    provider: "other",
    price_usd: 0,
    billing: "payg",
    type: "payg",
    pricing: {
      input_per_1m_tokens: 5.0,
      output_per_1m_tokens: 15.0,
      by_model: {
        "grok-3": { input: 5.0, output: 15.0 },
        "grok-3-mini": { input: 0.30, output: 0.50 },
        "grok-2": { input: 2.0, output: 10.0 },
      },
    },
  },
];

// Model pricing lookup (used by analysisService)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic Models (per 1M tokens)
  "claude-opus-4-5-20251101": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-5-20250929": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-5-sonnet-20240620": { input: 3.0, output: 15.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  "claude-3-sonnet-20240229": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku-20241022": { input: 0.80, output: 4.0 },
  "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  // OpenAI Models (per 1M tokens)
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.60 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  "gpt-4-turbo-2024-04-09": { input: 10.0, output: 30.0 },
  "gpt-4": { input: 30.0, output: 60.0 },
  "gpt-3.5-turbo": { input: 0.50, output: 1.50 },
  "o1": { input: 15.0, output: 60.0 },
  "o1-mini": { input: 3.0, output: 12.0 },
  "o1-preview": { input: 15.0, output: 60.0 },
  // Default fallback
  "default": { input: 5.0, output: 20.0 },
};

// Claude subscription plan limits for plan fit analysis
// Key insight: Claude plans limit by MESSAGE COUNT, not tokens
export const PLAN_LIMITS = {
  'Claude Pro': { messagesPerDay: 100, price: 20 },
  'Claude Max 5x': { messagesPerDay: 500, price: 100 },
  'Claude Max 20x': { messagesPerDay: 2000, price: 200 },
} as const;

// Type for plan limit keys
export type PlanLimitKey = keyof typeof PLAN_LIMITS;

// Cache token pricing (Anthropic charges for cache writes)
export const CACHE_PRICING: Record<string, { write: number; read: number }> = {
  "claude-opus-4-5-20251101": { write: 18.75, read: 1.875 },
  "claude-sonnet-4-5-20250929": { write: 3.75, read: 0.375 },
  "claude-3-5-sonnet-20241022": { write: 3.75, read: 0.375 },
  "claude-3-5-sonnet-20240620": { write: 3.75, read: 0.375 },
  "claude-3-opus-20240229": { write: 18.75, read: 1.875 },
  "claude-3-5-haiku-20241022": { write: 1.0, read: 0.10 },
  "claude-3-haiku-20240307": { write: 0.30, read: 0.03 },
  "default": { write: 3.75, read: 0.375 },
};

// Helper to get plan by name
export function getPlanByName(name: string): PlanInfo | undefined {
  return PLANS_DATABASE.find(p => p.name.toLowerCase() === name.toLowerCase());
}

// Helper to get plans by provider
export function getPlansByProvider(provider: string): PlanInfo[] {
  return PLANS_DATABASE.filter(p => p.provider === provider);
}

// Helper to get API plan for provider
export function getAPIplan(provider: 'anthropic' | 'openai'): PlanInfo | undefined {
  return PLANS_DATABASE.find(p => p.provider === provider && p.type === 'payg');
}

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

export const COLLECTOR_SCRIPT_TEMPLATE = `const fs = require('fs');
const path = require('path');
const os = require('os');

// === CONFIGURATION ===
const HOME = os.homedir();
// Default paths for Claude
const CLAUDE_DIR = path.join(HOME, '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

async function collectClaudeUsage() {
  console.log('\\x1b[36m%s\\x1b[0m', '🔍 LLM Usage Analyzer - Local Agent');
  console.log('Target directory:', PROJECTS_DIR);
  
  if (!fs.existsSync(PROJECTS_DIR)) {
    console.error('\\x1b[31m%s\\x1b[0m', '❌ Claude projects directory not found.');
    console.log('Path checked: ' + PROJECTS_DIR);
    console.log('Ensure you have Claude Code CLI installed and have initialized projects.');
    return;
  }

  const usage = {
    provider: 'anthropic',
    source: 'local_agent',
    period: { start: new Date().toISOString(), end: new Date().toISOString() },
    plan: { name: 'Claude Pro', price_usd: 20, type: 'subscription' },
    usage: {
      tokens: { input: 0, output: 0, cached: 0, by_model: {} },
      messages: { count: 0, by_day: [] },
      sessions: { count: 0 }
    }
  };

  const dayMap = {};
  let minDate = new Date();
  let maxDate = new Date(0);
  let filesProcessed = 0;

  try {
    const projects = fs.readdirSync(PROJECTS_DIR);
    console.log(\`Found \${projects.length} project folders...\`);
    
    for (const project of projects) {
      const projectPath = path.join(PROJECTS_DIR, project);
      if (!fs.statSync(projectPath).isDirectory()) continue;

      // Look for session files
      const files = fs.readdirSync(projectPath).filter(f => f.endsWith('.jsonl'));
      
      for (const file of files) {
        usage.usage.sessions.count++;
        filesProcessed++;
        
        const content = fs.readFileSync(path.join(projectPath, file), 'utf-8');
        const lines = content.split('\\n');

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const entry = JSON.parse(line);
            if (entry.message && entry.message.usage) {
              const { input_tokens, output_tokens, cache_read_input_tokens } = entry.message.usage;
              const model = entry.message.model;
              const ts = new Date(entry.timestamp || Date.now());

              if (ts < minDate) minDate = ts;
              if (ts > maxDate) maxDate = ts;

              // Tokens
              usage.usage.tokens.input += (input_tokens || 0);
              usage.usage.tokens.output += (output_tokens || 0);
              usage.usage.tokens.cached += (cache_read_input_tokens || 0);

              // By Model
              if (!usage.usage.tokens.by_model[model]) {
                usage.usage.tokens.by_model[model] = { input: 0, output: 0 };
              }
              usage.usage.tokens.by_model[model].input += (input_tokens || 0);
              usage.usage.tokens.by_model[model].output += (output_tokens || 0);

              // Messages & Days
              usage.usage.messages.count++;
              const dateKey = ts.toISOString().split('T')[0];
              if (!dayMap[dateKey]) {
                dayMap[dateKey] = { count: 0, input: 0, output: 0 };
              }
              dayMap[dateKey].count++;
              dayMap[dateKey].input += (input_tokens || 0);
              dayMap[dateKey].output += (output_tokens || 0);
            }
          } catch (e) {
            // ignore partial lines
          }
        }
      }
    }

    if (filesProcessed === 0) {
      console.log('\\x1b[33m%s\\x1b[0m', '⚠️  No usage history files found in projects.');
      return;
    }

    // Finalize
    usage.period.start = minDate.toISOString();
    usage.period.end = maxDate.toISOString();
    usage.usage.messages.by_day = Object.entries(dayMap).map(([date, data]) => ({
      date, ...data
    })).sort((a, b) => a.date.localeCompare(b.date));

    const outFile = 'usage_report.json';
    fs.writeFileSync(outFile, JSON.stringify(usage, null, 2));
    
    console.log('\\n' + '='.repeat(40));
    console.log('\\x1b[32m%s\\x1b[0m', '✅ Report generated successfully!');
    console.log('File: ' + path.resolve(outFile));
    console.log('Processed: ' + filesProcessed + ' sessions');
    console.log('Total Tokens: ' + (usage.usage.tokens.input + usage.usage.tokens.output));
    console.log('='.repeat(40));
    console.log('👉 Upload this file to the web dashboard.');

  } catch (err) {
    console.error('Error scanning files:', err);
  }
}

collectClaudeUsage();`;