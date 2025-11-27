import { Command } from 'commander';
import chalk from 'chalk';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { scanClaudeUsage, claudeDataExists, getClaudeDataPath } from '../parsers/claude.js';

const DEFAULT_PORT = 3456;

export const serveCommand = new Command('serve')
  .description('Start a local server to serve usage data to the web dashboard')
  .option('-p, --port <number>', `Port to listen on (default: ${DEFAULT_PORT})`, parseInt)
  .option('-d, --days <number>', 'Only include data from the last N days', parseInt)
  .action(async (options: { port?: number; days?: number }) => {
    const port = options.port || DEFAULT_PORT;

    // Check if Claude data exists
    if (!claudeDataExists()) {
      console.error(chalk.red('\n  Claude Code data not found.'));
      console.error(chalk.gray(`  Expected location: ${getClaudeDataPath()}`));
      console.error(chalk.gray('  Make sure Claude Code CLI is installed and you have used it.\n'));
      process.exit(1);
    }

    console.log(chalk.cyan('\n  LLM Usage Analyzer - Local Server\n'));
    console.log(chalk.gray(`  Data source: ${getClaudeDataPath()}`));
    if (options.days) {
      console.log(chalk.gray(`  Period: Last ${options.days} days`));
    }
    console.log('');

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      // CORS headers for localhost web app
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');

      // Handle preflight
      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const url = req.url?.split('?')[0];

      if (url === '/api/health') {
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        console.log(chalk.gray(`  ${new Date().toLocaleTimeString()} GET /api/health - 200`));
      } else if (url === '/api/usage') {
        try {
          const scanOptions = options.days ? { days: options.days } : {};
          const { report } = await scanClaudeUsage(scanOptions);
          res.end(JSON.stringify(report));
          console.log(chalk.green(`  ${new Date().toLocaleTimeString()} GET /api/usage - 200 (${report.usage.messages.count} messages)`));
        } catch (error) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Failed to scan usage data' }));
          console.log(chalk.red(`  ${new Date().toLocaleTimeString()} GET /api/usage - 500 Error: ${error}`));
        }
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
        console.log(chalk.yellow(`  ${new Date().toLocaleTimeString()} GET ${url} - 404`));
      }
    });

    server.listen(port, () => {
      console.log(chalk.green(`  Server running at http://localhost:${port}`));
      console.log('');
      console.log(chalk.white('  Endpoints:'));
      console.log(chalk.gray(`    GET /api/health  - Connection check`));
      console.log(chalk.gray(`    GET /api/usage   - Full usage report (re-scans on each request)`));
      console.log('');
      console.log(chalk.cyan('  The web dashboard will auto-detect this server.'));
      console.log(chalk.gray('  Press Ctrl+C to stop.\n'));
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log(chalk.gray('\n  Shutting down server...'));
      server.close(() => {
        console.log(chalk.green('  Server stopped.\n'));
        process.exit(0);
      });
    });
  });
