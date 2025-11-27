#!/usr/bin/env node
import { program } from 'commander';
import { scanCommand } from './commands/scan.js';
import { analyzeCommand } from './commands/analyze.js';
import { serveCommand } from './commands/serve.js';

const VERSION = '1.0.0';

program
  .name('llm-usage')
  .description('Analyze your LLM usage patterns from Claude Code and other providers')
  .version(VERSION);

// Add commands
program.addCommand(scanCommand);
program.addCommand(analyzeCommand);
program.addCommand(serveCommand);

// Default action (no command) - show help
program.action(() => {
  console.log(`
  🔍 LLM Usage Analyzer CLI v${VERSION}

  Analyze your Claude Code usage to determine if you're on the right plan.

  Commands:
    scan      Scan Claude Code local data and generate a usage report
    analyze   Analyze a usage report and show cost recommendations
    serve     Start a local server for the web dashboard to connect

  Examples:
    $ llm-usage scan                    # Scan all data, output usage_report.json
    $ llm-usage scan --days 30          # Only last 30 days
    $ llm-usage scan --json | jq        # Output JSON for piping
    $ llm-usage analyze                 # Analyze usage_report.json
    $ llm-usage analyze --plan "Claude Max" --price 100
    $ llm-usage serve                   # Start server on localhost:3456
    $ llm-usage serve --port 8080       # Use custom port

  For more info, run any command with --help
  `);
});

program.parse();
