import { UsageReport, StoredReport } from '../types';
import { MODEL_PRICING } from '../constants';

/**
 * Export a single report to JSON
 */
export function exportToJSON(report: UsageReport, filename?: string): void {
  const json = JSON.stringify(report, null, 2);
  downloadFile(json, filename || generateFilename('json'), 'application/json');
}

/**
 * Export multiple reports to JSON
 */
export function exportReportsToJSON(reports: StoredReport[], filename?: string): void {
  const json = JSON.stringify(reports, null, 2);
  downloadFile(json, filename || `usage-reports-${formatDate(new Date())}.json`, 'application/json');
}

/**
 * Export report to CSV format
 */
export function exportToCSV(report: UsageReport, filename?: string): void {
  const csv = generateCSV(report);
  downloadFile(csv, filename || generateFilename('csv'), 'text/csv');
}

/**
 * Export daily breakdown to CSV
 */
export function exportDailyToCSV(report: UsageReport, filename?: string): void {
  const headers = ['Date', 'Messages', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Estimated Cost'];
  const rows = report.usage.messages.by_day.map(day => {
    const totalTokens = day.input + day.output;
    const cost = estimateDayCost(day.input, day.output, report);
    return [
      day.date,
      day.count.toString(),
      day.input.toString(),
      day.output.toString(),
      totalTokens.toString(),
      `$${cost.toFixed(4)}`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, filename || `daily-usage-${formatDate(new Date())}.csv`, 'text/csv');
}

/**
 * Export model breakdown to CSV
 */
export function exportModelBreakdownToCSV(report: UsageReport, filename?: string): void {
  const headers = ['Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Input Cost', 'Output Cost', 'Total Cost'];
  const rows = Object.entries(report.usage.tokens.by_model).map(([model, tokens]) => {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;
    return [
      model,
      tokens.input.toString(),
      tokens.output.toString(),
      (tokens.input + tokens.output).toString(),
      `$${inputCost.toFixed(4)}`,
      `$${outputCost.toFixed(4)}`,
      `$${(inputCost + outputCost).toFixed(4)}`,
    ];
  });

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, filename || `model-usage-${formatDate(new Date())}.csv`, 'text/csv');
}

/**
 * Generate a comprehensive CSV report
 */
function generateCSV(report: UsageReport): string {
  const lines: string[] = [];

  // Header section
  lines.push('LLM Usage Report');
  lines.push(`Provider,${report.provider}`);
  lines.push(`Source,${report.source}`);
  lines.push(`Period Start,${report.period.start}`);
  lines.push(`Period End,${report.period.end}`);
  lines.push(`Plan,${report.plan.name}`);
  lines.push(`Plan Price,$${report.plan.price_usd}`);
  lines.push('');

  // Summary section
  lines.push('SUMMARY');
  lines.push(`Total Input Tokens,${report.usage.tokens.input}`);
  lines.push(`Total Output Tokens,${report.usage.tokens.output}`);
  lines.push(`Total Tokens,${report.usage.tokens.input + report.usage.tokens.output}`);
  lines.push(`Cached Tokens,${report.usage.tokens.cached || 0}`);
  lines.push(`Message Count,${report.usage.messages.count}`);
  lines.push(`Session Count,${report.usage.sessions.count}`);
  lines.push('');

  // Calculate total cost
  let totalCost = 0;
  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    totalCost += (tokens.input / 1_000_000) * pricing.input;
    totalCost += (tokens.output / 1_000_000) * pricing.output;
  }
  lines.push(`Estimated API Cost,$${totalCost.toFixed(2)}`);
  lines.push('');

  // Model breakdown
  lines.push('MODEL BREAKDOWN');
  lines.push('Model,Input Tokens,Output Tokens,Total Tokens,Estimated Cost');
  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const cost = (tokens.input / 1_000_000) * pricing.input + (tokens.output / 1_000_000) * pricing.output;
    lines.push(`${model},${tokens.input},${tokens.output},${tokens.input + tokens.output},$${cost.toFixed(4)}`);
  }
  lines.push('');

  // Daily breakdown
  if (report.usage.messages.by_day.length > 0) {
    lines.push('DAILY BREAKDOWN');
    lines.push('Date,Messages,Input Tokens,Output Tokens');
    for (const day of report.usage.messages.by_day) {
      lines.push(`${day.date},${day.count},${day.input},${day.output}`);
    }
  }

  return lines.join('\n');
}

/**
 * Export to PDF format (creates printable HTML that can be saved as PDF)
 */
export function exportToPDF(report: UsageReport): void {
  const html = generatePDFHTML(report);

  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Auto-trigger print dialog
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Generate HTML for PDF export
 */
function generatePDFHTML(report: UsageReport): string {
  // Calculate costs
  let totalCost = 0;
  const modelCosts: Record<string, { input: number; output: number; total: number }> = {};

  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;
    modelCosts[model] = { input: inputCost, output: outputCost, total: inputCost + outputCost };
    totalCost += inputCost + outputCost;
  }

  const totalTokens = report.usage.tokens.input + report.usage.tokens.output;
  const periodStart = new Date(report.period.start).toLocaleDateString();
  const periodEnd = new Date(report.period.end).toLocaleDateString();

  return `
<!DOCTYPE html>
<html>
<head>
  <title>LLM Usage Report - ${periodStart} to ${periodEnd}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { font-size: 24px; margin-bottom: 8px; }
    h2 { font-size: 18px; margin: 24px 0 12px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    .header { margin-bottom: 32px; }
    .header-meta { color: #64748b; font-size: 14px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
    }
    .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; }
    .stat-value { font-size: 24px; font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      color: #64748b;
    }
    td { font-size: 14px; }
    .number { text-align: right; font-variant-numeric: tabular-nums; }
    .highlight { background: #fef3c7; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>LLM Usage Report</h1>
    <p class="header-meta">
      ${report.provider.charAt(0).toUpperCase() + report.provider.slice(1)} •
      ${periodStart} to ${periodEnd} •
      ${report.plan.name}
    </p>
  </div>

  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">Total Tokens</div>
      <div class="stat-value">${formatNumberWithCommas(totalTokens)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Estimated Cost</div>
      <div class="stat-value">$${totalCost.toFixed(2)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Messages</div>
      <div class="stat-value">${formatNumberWithCommas(report.usage.messages.count)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Sessions</div>
      <div class="stat-value">${report.usage.sessions.count}</div>
    </div>
  </div>

  <h2>Token Usage</h2>
  <div class="grid">
    <div class="stat-card">
      <div class="stat-label">Input Tokens</div>
      <div class="stat-value">${formatNumberWithCommas(report.usage.tokens.input)}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Output Tokens</div>
      <div class="stat-value">${formatNumberWithCommas(report.usage.tokens.output)}</div>
    </div>
  </div>

  <h2>Model Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Model</th>
        <th class="number">Input</th>
        <th class="number">Output</th>
        <th class="number">Cost</th>
      </tr>
    </thead>
    <tbody>
      ${Object.entries(report.usage.tokens.by_model).map(([model, tokens]) => `
        <tr>
          <td>${model}</td>
          <td class="number">${formatNumberWithCommas(tokens.input)}</td>
          <td class="number">${formatNumberWithCommas(tokens.output)}</td>
          <td class="number">$${modelCosts[model]?.total.toFixed(4) || '0.00'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${report.usage.messages.by_day.length > 0 ? `
    <h2>Daily Activity (Last 10 Days)</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th class="number">Messages</th>
          <th class="number">Input Tokens</th>
          <th class="number">Output Tokens</th>
        </tr>
      </thead>
      <tbody>
        ${report.usage.messages.by_day.slice(-10).reverse().map(day => `
          <tr>
            <td>${day.date}</td>
            <td class="number">${day.count}</td>
            <td class="number">${formatNumberWithCommas(day.input)}</td>
            <td class="number">${formatNumberWithCommas(day.output)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="footer">
    Generated by LLM Usage Analyzer • ${new Date().toLocaleString()}
  </div>

  <script>
    // Auto-print when loaded
    window.onload = function() {
      // Slight delay to ensure styles are applied
      setTimeout(function() { window.print(); }, 250);
    };
  </script>
</body>
</html>
`;
}

/**
 * Copy report data to clipboard
 */
export async function copyToClipboard(report: UsageReport): Promise<boolean> {
  try {
    const text = generateClipboardText(report);
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function generateClipboardText(report: UsageReport): string {
  const totalTokens = report.usage.tokens.input + report.usage.tokens.output;
  let totalCost = 0;

  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    totalCost += (tokens.input / 1_000_000) * pricing.input;
    totalCost += (tokens.output / 1_000_000) * pricing.output;
  }

  return `LLM Usage Report
Provider: ${report.provider}
Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}
Plan: ${report.plan.name}

Summary:
- Total Tokens: ${formatNumberWithCommas(totalTokens)}
- Input Tokens: ${formatNumberWithCommas(report.usage.tokens.input)}
- Output Tokens: ${formatNumberWithCommas(report.usage.tokens.output)}
- Messages: ${report.usage.messages.count}
- Estimated Cost: $${totalCost.toFixed(2)}

Models Used:
${Object.entries(report.usage.tokens.by_model)
  .map(([model, tokens]) => `- ${model}: ${formatNumberWithCommas(tokens.input + tokens.output)} tokens`)
  .join('\n')}
`;
}

// Helper functions
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateFilename(extension: string): string {
  return `usage-report-${formatDate(new Date())}.${extension}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatNumberWithCommas(num: number): string {
  return num.toLocaleString();
}

function estimateDayCost(input: number, output: number, report: UsageReport): number {
  // Use first model's pricing as estimate, or default
  const firstModel = Object.keys(report.usage.tokens.by_model)[0];
  const pricing = firstModel ? MODEL_PRICING[firstModel] : MODEL_PRICING['default'];

  return (input / 1_000_000) * pricing.input + (output / 1_000_000) * pricing.output;
}
