import { UsageReport } from '../types';

interface OpenAIUsageBucket {
  object: string;
  input_tokens: number;
  output_tokens: number;
  num_model_requests: number;
  project_id: string | null;
  user_id: string | null;
  api_key_id: string | null;
  model: string | null;
  batch: boolean | null;
  input_cached_tokens?: number;
}

interface OpenAIUsageResponse {
  object: string;
  data: OpenAIUsageBucket[];
  has_more: boolean;
  next_page: string | null;
}

/**
 * Fetch usage data from OpenAI Usage API
 * Requires an admin API key with usage read permissions
 */
export async function fetchOpenAIUsage(
  apiKey: string,
  startDate: Date,
  endDate: Date
): Promise<UsageReport> {
  const startTime = Math.floor(startDate.getTime() / 1000);
  const endTime = Math.floor(endDate.getTime() / 1000);

  const url = new URL('https://api.openai.com/v1/organization/usage/completions');
  url.searchParams.set('start_time', startTime.toString());
  url.searchParams.set('end_time', endTime.toString());
  url.searchParams.set('bucket_width', '1d');
  url.searchParams.set('group_by', 'model');

  const allData: OpenAIUsageBucket[] = [];
  let nextPage: string | null = url.toString();

  // Paginate through all results
  while (nextPage) {
    const response = await fetch(nextPage, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${error}`);
    }

    const data: OpenAIUsageResponse = await response.json();
    allData.push(...data.data);

    nextPage = data.has_more && data.next_page ? data.next_page : null;
  }

  return transformOpenAIResponse(allData, startDate, endDate);
}

/**
 * Transform OpenAI API response to unified UsageReport format
 */
function transformOpenAIResponse(
  data: OpenAIUsageBucket[],
  startDate: Date,
  endDate: Date
): UsageReport {
  const report: UsageReport = {
    provider: 'openai',
    source: 'api',
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    plan: {
      name: 'OpenAI API',
      price_usd: 0,
      type: 'payg',
    },
    usage: {
      tokens: {
        input: 0,
        output: 0,
        cached: 0,
        by_model: {},
      },
      messages: {
        count: 0,
        by_day: [],
      },
      sessions: {
        count: 0,
      },
    },
  };

  const dayMap: Record<string, { count: number; input: number; output: number }> = {};

  for (const bucket of data) {
    const inputTokens = bucket.input_tokens || 0;
    const outputTokens = bucket.output_tokens || 0;
    const cachedTokens = bucket.input_cached_tokens || 0;
    const model = bucket.model || 'unknown';
    const requests = bucket.num_model_requests || 0;

    // Aggregate totals
    report.usage.tokens.input += inputTokens;
    report.usage.tokens.output += outputTokens;
    report.usage.tokens.cached = (report.usage.tokens.cached || 0) + cachedTokens;

    // By model
    if (!report.usage.tokens.by_model[model]) {
      report.usage.tokens.by_model[model] = { input: 0, output: 0 };
    }
    report.usage.tokens.by_model[model].input += inputTokens;
    report.usage.tokens.by_model[model].output += outputTokens;

    // Message count (approximate from requests)
    report.usage.messages.count += requests;
  }

  // Convert day map to array (OpenAI doesn't give daily breakdown in grouped response)
  // For now, we'll create a single entry spanning the period
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const avgPerDay = {
    count: Math.round(report.usage.messages.count / totalDays),
    input: Math.round(report.usage.tokens.input / totalDays),
    output: Math.round(report.usage.tokens.output / totalDays),
  };

  // Generate daily entries (estimated)
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dayMap[dateStr] = { ...avgPerDay };
  }

  report.usage.messages.by_day = Object.entries(dayMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Estimate sessions (roughly 1 session per 10 messages)
  report.usage.sessions.count = Math.max(1, Math.round(report.usage.messages.count / 10));

  return report;
}

/**
 * Validate an OpenAI API key format
 */
export function isValidOpenAIKey(key: string): boolean {
  // OpenAI keys start with 'sk-' and are typically 51+ characters
  return key.startsWith('sk-') && key.length >= 40;
}

/**
 * Test if an API key has usage read permissions
 */
export async function testOpenAIConnection(apiKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Try to fetch a small date range to test permissions
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);

    const url = new URL('https://api.openai.com/v1/organization/usage/completions');
    url.searchParams.set('start_time', Math.floor(startDate.getTime() / 1000).toString());
    url.searchParams.set('end_time', Math.floor(endDate.getTime() / 1000).toString());
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      return { success: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    } else if (response.status === 403) {
      return { success: false, error: 'API key lacks usage read permissions. Admin keys required.' };
    }

    return { success: false, error: errorMessage };
  } catch (err) {
    return { success: false, error: `Connection failed: ${err}` };
  }
}
