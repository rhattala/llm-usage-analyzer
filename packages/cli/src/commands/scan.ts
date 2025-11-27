import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import {
  scanClaudeUsage,
  claudeDataExists,
  getClaudeDataPath,
  formatTokens,
} from '../parsers/claude.js';
import type { ScanOptions } from '../types.js';

export const scanCommand = new Command('scan')
  .description('Scan Claude Code local data for usage statistics')
  .option('-d, --days <number>', 'Only include data from the last N days', parseInt)
  .option('--start-date <date>', 'Start date (YYYY-MM-DD)')
  .option('--end-date <date>', 'End date (YYYY-MM-DD)')
  .option('-o, --output <file>', 'Output file path (default: usage_report.json)')
  .option('--json', 'Output raw JSON to stdout (for piping)')
  .option('-v, --verbose', 'Show detailed progress')
  .action(async (options: ScanOptions) => {
    // Check if Claude data exists
    if (!claudeDataExists()) {
      console.error(chalk.red('\n❌ Claude Code data not found.'));
      console.error(chalk.gray(`   Expected location: ${getClaudeDataPath()}`));
      console.error(chalk.gray('   Make sure Claude Code CLI is installed and you have used it.\n'));
      process.exit(1);
    }

    // JSON mode: quiet output
    if (options.json) {
      const { report } = await scanClaudeUsage(options);
      console.log(JSON.stringify(report, null, 2));
      return;
    }

    // Interactive mode with progress
    console.log(chalk.cyan('\n🔍 LLM Usage Analyzer - Local Agent\n'));
    console.log(chalk.gray(`   Scanning: ${getClaudeDataPath()}`));

    if (options.days) {
      console.log(chalk.gray(`   Period: Last ${options.days} days`));
    } else if (options.startDate || options.endDate) {
      console.log(chalk.gray(`   Period: ${options.startDate || 'beginning'} to ${options.endDate || 'now'}`));
    }

    console.log('');

    const spinner = ora('Scanning projects...').start();

    const { report, progress } = await scanClaudeUsage(options, (p) => {
      spinner.text = `Scanning... ${p.projectsFound} projects, ${p.filesProcessed} sessions, ${p.messagesProcessed} messages`;
    });

    spinner.stop();

    if (progress.errors.length > 0 && options.verbose) {
      console.log(chalk.yellow('\n⚠️  Some errors occurred:'));
      progress.errors.slice(0, 5).forEach((err) => {
        console.log(chalk.gray(`   ${err}`));
      });
      if (progress.errors.length > 5) {
        console.log(chalk.gray(`   ...and ${progress.errors.length - 5} more`));
      }
    }

    if (progress.messagesProcessed === 0) {
      console.log(chalk.yellow('\n⚠️  No usage data found.'));
      console.log(chalk.gray('   This could mean:'));
      console.log(chalk.gray('   - Claude Code hasn\'t been used yet'));
      console.log(chalk.gray('   - The date range doesn\'t contain any data'));
      console.log('');
      return;
    }

    // Print summary
    console.log(chalk.green('\n✅ Scan complete!\n'));
    console.log(chalk.white('   📊 Usage Summary'));
    console.log(chalk.gray('   ' + '─'.repeat(40)));

    console.log(`   ${chalk.white('Sessions:')}     ${progress.filesProcessed}`);
    console.log(`   ${chalk.white('Messages:')}     ${progress.messagesProcessed}`);
    console.log('');

    const totalTokens = report.usage.tokens.input + report.usage.tokens.output;
    console.log(`   ${chalk.white('Input Tokens:')}  ${chalk.cyan(formatTokens(report.usage.tokens.input))}`);
    console.log(`   ${chalk.white('Output Tokens:')} ${chalk.cyan(formatTokens(report.usage.tokens.output))}`);
    console.log(`   ${chalk.white('Total Tokens:')}  ${chalk.cyan(formatTokens(totalTokens))}`);

    if (report.usage.tokens.cached && report.usage.tokens.cached > 0) {
      console.log(`   ${chalk.white('Cached Tokens:')} ${chalk.gray(formatTokens(report.usage.tokens.cached))}`);
    }

    console.log('');
    console.log(chalk.white('   📈 By Model'));
    console.log(chalk.gray('   ' + '─'.repeat(40)));

    const models = Object.entries(report.usage.tokens.by_model)
      .sort(([, a], [, b]) => (b.input + b.output) - (a.input + a.output));

    for (const [model, tokens] of models) {
      const modelTotal = tokens.input + tokens.output;
      const percentage = ((modelTotal / totalTokens) * 100).toFixed(1);
      const shortModel = model.replace('claude-', '').replace('gpt-', '');
      console.log(`   ${chalk.gray(shortModel.padEnd(30))} ${chalk.cyan(formatTokens(modelTotal).padStart(8))} ${chalk.gray(`(${percentage}%)`)}`);
    }

    console.log('');
    console.log(chalk.white('   📅 Period'));
    console.log(chalk.gray('   ' + '─'.repeat(40)));

    const startDate = new Date(report.period.start).toLocaleDateString();
    const endDate = new Date(report.period.end).toLocaleDateString();
    console.log(`   ${chalk.white('From:')} ${startDate}  ${chalk.white('To:')} ${endDate}`);

    // Write output file
    const outputFile = options.output || 'usage_report.json';
    const outputPath = path.resolve(outputFile);

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

    console.log('');
    console.log(chalk.gray('   ' + '─'.repeat(40)));
    console.log(chalk.green(`   📄 Report saved: ${outputPath}`));
    console.log(chalk.gray('   Upload this file to the web dashboard for analysis.\n'));
  });
