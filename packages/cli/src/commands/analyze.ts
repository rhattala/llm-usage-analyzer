import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import type { UsageReport, AnalyzeOptions } from '../types.js';
import { formatTokens } from '../parsers/claude.js';

// Model pricing (per 1M tokens)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-5-20251101': { input: 15.0, output: 75.0 },
  'claude-sonnet-4-5-20250929': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-sonnet-20240620': { input: 3.0, output: 15.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
  'claude-3-sonnet-20240229': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.80, output: 4.0 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'default': { input: 5.0, output: 20.0 },
};

function calculateAPICost(report: UsageReport): number {
  let totalCost = 0;

  for (const [model, tokens] of Object.entries(report.usage.tokens.by_model)) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;
    totalCost += inputCost + outputCost;
  }

  return totalCost;
}

export const analyzeCommand = new Command('analyze')
  .description('Analyze a usage report and show cost comparison')
  .argument('[file]', 'Usage report JSON file (default: usage_report.json)')
  .option('-p, --plan <name>', 'Your current plan name', 'Claude Pro')
  .option('--price <amount>', 'Your plan price in USD', parseFloat, 20)
  .option('-v, --verbose', 'Show detailed breakdown')
  .action(async (file: string | undefined, options: AnalyzeOptions) => {
    const inputFile = file || 'usage_report.json';
    const inputPath = path.resolve(inputFile);

    if (!fs.existsSync(inputPath)) {
      console.error(chalk.red(`\n❌ File not found: ${inputPath}`));
      console.error(chalk.gray('   Run `llm-usage scan` first to generate a report.\n'));
      process.exit(1);
    }

    let report: UsageReport;
    try {
      const content = fs.readFileSync(inputPath, 'utf-8');
      report = JSON.parse(content);
    } catch (err) {
      console.error(chalk.red(`\n❌ Failed to parse report: ${err}`));
      process.exit(1);
    }

    const planPrice = options.price || report.plan?.price_usd || 20;
    const planName = options.plan || report.plan?.name || 'Claude Pro';

    console.log(chalk.cyan('\n📊 LLM Usage Analysis\n'));
    console.log(chalk.gray('─'.repeat(50)));

    // Token Summary
    const totalInput = report.usage.tokens.input;
    const totalOutput = report.usage.tokens.output;
    const totalTokens = totalInput + totalOutput;

    console.log(`\n${chalk.white('Token Usage')}`);
    console.log(`  Input:  ${chalk.cyan(formatTokens(totalInput))}`);
    console.log(`  Output: ${chalk.cyan(formatTokens(totalOutput))}`);
    console.log(`  Total:  ${chalk.cyan(formatTokens(totalTokens))}`);

    // Cost Analysis
    const apiCost = calculateAPICost(report);

    console.log(`\n${chalk.white('Cost Analysis')}`);
    console.log(`  Your Plan:       ${chalk.white(planName)} ${chalk.gray(`($${planPrice}/mo)`)}`);
    console.log(`  API Equivalent:  ${chalk.cyan(`$${apiCost.toFixed(2)}/mo`)}`);

    const savings = planPrice - apiCost;
    const savingsPercent = ((savings / planPrice) * 100).toFixed(0);

    console.log('');
    if (savings > 0) {
      // Overpaying
      console.log(chalk.yellow(`  ⚠️  You're paying $${savings.toFixed(2)} more than API would cost`));
      console.log(chalk.gray(`      That's ${savingsPercent}% more than pay-as-you-go pricing`));

      if (apiCost < 20) {
        console.log(chalk.green(`\n  💡 Recommendation: Consider switching to API`));
        console.log(chalk.gray(`     With your usage, API would cost only $${apiCost.toFixed(2)}/mo`));
      } else if (apiCost < 100 && planPrice >= 100) {
        console.log(chalk.green(`\n  💡 Recommendation: Consider Claude Pro ($20/mo)`));
        console.log(chalk.gray(`     Your usage fits within the Pro tier`));
      }
    } else {
      // Good value
      const valuePercent = ((Math.abs(savings) / apiCost) * 100).toFixed(0);
      console.log(chalk.green(`  ✅ Good value! You're saving $${Math.abs(savings).toFixed(2)} vs API`));
      console.log(chalk.gray(`     That's ${valuePercent}% cheaper than pay-as-you-go`));
    }

    // Model Breakdown
    if (options.verbose) {
      console.log(`\n${chalk.white('Model Breakdown')}`);
      console.log(chalk.gray('─'.repeat(50)));

      const models = Object.entries(report.usage.tokens.by_model)
        .sort(([, a], [, b]) => (b.input + b.output) - (a.input + a.output));

      for (const [model, tokens] of models) {
        const pricing = MODEL_PRICING[model] || MODEL_PRICING['default'];
        const inputCost = (tokens.input / 1_000_000) * pricing.input;
        const outputCost = (tokens.output / 1_000_000) * pricing.output;
        const modelCost = inputCost + outputCost;
        const percentage = (((tokens.input + tokens.output) / totalTokens) * 100).toFixed(1);

        const shortModel = model.replace('claude-', '').replace('gpt-', '');
        console.log(`\n  ${chalk.white(shortModel)}`);
        console.log(`    Tokens: ${formatTokens(tokens.input + tokens.output)} (${percentage}%)`);
        console.log(`    Cost:   $${modelCost.toFixed(2)}`);
      }
    }

    // Period
    console.log(`\n${chalk.gray('─'.repeat(50))}`);
    const startDate = new Date(report.period.start).toLocaleDateString();
    const endDate = new Date(report.period.end).toLocaleDateString();
    console.log(chalk.gray(`  Period: ${startDate} - ${endDate}`));
    console.log(chalk.gray(`  Messages: ${report.usage.messages.count} | Sessions: ${report.usage.sessions.count}`));
    console.log('');
  });
