import { StoredReport, TrendData, UsageTrend, UsageReport } from '../types';
import { MODEL_PRICING } from '../constants';

/**
 * Calculate cost for a usage report
 */
function calculateReportCost(report: UsageReport): number {
  let totalCost = 0;

  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;
    totalCost += inputCost + outputCost;
  }

  return totalCost;
}

/**
 * Group stored reports by month
 */
export function groupReportsByMonth(reports: StoredReport[]): Map<string, StoredReport[]> {
  const grouped = new Map<string, StoredReport[]>();

  for (const stored of reports) {
    const date = new Date(stored.report.period.start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(stored);
  }

  return grouped;
}

/**
 * Calculate monthly trend data from stored reports
 */
export function calculateMonthlyTrends(reports: StoredReport[]): TrendData[] {
  const grouped = groupReportsByMonth(reports);
  const trends: TrendData[] = [];

  for (const [period, monthReports] of grouped) {
    // Aggregate all reports in this month
    const trend: TrendData = {
      period,
      totalTokens: 0,
      totalCost: 0,
      inputTokens: 0,
      outputTokens: 0,
      messageCount: 0,
      sessionCount: 0,
    };

    for (const stored of monthReports) {
      const { report } = stored;
      trend.inputTokens += report.usage.tokens.input;
      trend.outputTokens += report.usage.tokens.output;
      trend.totalTokens += report.usage.tokens.input + report.usage.tokens.output;
      trend.messageCount += report.usage.messages.count;
      trend.sessionCount += report.usage.sessions.count;
      trend.totalCost += calculateReportCost(report);
    }

    trends.push(trend);
  }

  // Sort by period
  return trends.sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate usage trend analysis
 */
export function analyzeUsageTrends(reports: StoredReport[]): UsageTrend | null {
  if (reports.length === 0) return null;

  const monthlyData = calculateMonthlyTrends(reports);

  if (monthlyData.length === 0) return null;

  // Calculate percent change from previous period
  let percentChange = 0;
  if (monthlyData.length >= 2) {
    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];
    if (previous.totalCost > 0) {
      percentChange = ((current.totalCost - previous.totalCost) / previous.totalCost) * 100;
    }
  }

  // Calculate average daily cost across all data
  const totalDays = reports.reduce((acc, stored) => {
    const start = new Date(stored.report.period.start);
    const end = new Date(stored.report.period.end);
    return acc + Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, 0);

  const totalCost = monthlyData.reduce((acc, m) => acc + m.totalCost, 0);
  const avgDailyCost = totalDays > 0 ? totalCost / totalDays : 0;

  // Project monthly cost based on average daily
  const projectedMonthlyCost = avgDailyCost * 30;

  return {
    data: monthlyData,
    percentChange,
    avgDailyCost,
    projectedMonthlyCost,
  };
}

/**
 * Get daily usage breakdown across all reports
 */
export function getDailyBreakdown(reports: StoredReport[]): Array<{
  date: string;
  tokens: number;
  cost: number;
  messages: number;
}> {
  const dayMap = new Map<string, { tokens: number; cost: number; messages: number }>();

  for (const stored of reports) {
    for (const day of stored.report.usage.messages.by_day) {
      const existing = dayMap.get(day.date) || { tokens: 0, cost: 0, messages: 0 };
      const dayTokens = day.input + day.output;

      // Estimate cost based on token ratio
      const report = stored.report;
      const reportTotalTokens = report.usage.tokens.input + report.usage.tokens.output;
      const reportCost = calculateReportCost(report);
      const dayCost = reportTotalTokens > 0 ? (dayTokens / reportTotalTokens) * reportCost : 0;

      dayMap.set(day.date, {
        tokens: existing.tokens + dayTokens,
        cost: existing.cost + dayCost,
        messages: existing.messages + day.count,
      });
    }
  }

  return Array.from(dayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Get usage heatmap by day of week
 */
export function getWeekdayHeatmap(reports: StoredReport[]): Array<{
  day: string;
  avgTokens: number;
  avgMessages: number;
}> {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayStats: Record<number, { totalTokens: number; totalMessages: number; count: number }> = {};

  // Initialize
  for (let i = 0; i < 7; i++) {
    dayStats[i] = { totalTokens: 0, totalMessages: 0, count: 0 };
  }

  // Aggregate
  for (const stored of reports) {
    for (const day of stored.report.usage.messages.by_day) {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      dayStats[dayOfWeek].totalTokens += day.input + day.output;
      dayStats[dayOfWeek].totalMessages += day.count;
      dayStats[dayOfWeek].count++;
    }
  }

  // Calculate averages
  return dayNames.map((name, i) => ({
    day: name,
    avgTokens: dayStats[i].count > 0 ? dayStats[i].totalTokens / dayStats[i].count : 0,
    avgMessages: dayStats[i].count > 0 ? dayStats[i].totalMessages / dayStats[i].count : 0,
  }));
}

/**
 * Calculate model usage distribution across all reports
 */
export function getModelDistribution(reports: StoredReport[]): Array<{
  model: string;
  tokens: number;
  cost: number;
  percentage: number;
}> {
  const modelStats: Record<string, { input: number; output: number }> = {};
  let totalTokens = 0;

  for (const stored of reports) {
    for (const [model, tokens] of Object.entries(stored.report.usage.tokens.by_model)) {
      if (!modelStats[model]) {
        modelStats[model] = { input: 0, output: 0 };
      }
      modelStats[model].input += tokens.input;
      modelStats[model].output += tokens.output;
      totalTokens += tokens.input + tokens.output;
    }
  }

  return Object.entries(modelStats)
    .map(([model, tokens]) => {
      const modelTokens = tokens.input + tokens.output;
      const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
      const cost = (tokens.input / 1_000_000) * pricing.input + (tokens.output / 1_000_000) * pricing.output;

      return {
        model: model.replace('claude-', '').replace('gpt-', ''),
        tokens: modelTokens,
        cost,
        percentage: totalTokens > 0 ? (modelTokens / totalTokens) * 100 : 0,
      };
    })
    .sort((a, b) => b.tokens - a.tokens);
}

/**
 * Format month string for display
 */
export function formatMonth(period: string): string {
  const [year, month] = period.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}
