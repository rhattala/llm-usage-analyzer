# LLM Usage Analyzer

Analyze your Claude Code usage to find out if you're on the right subscription plan.

**The Question:** "I'm on Claude Max 20x ($200/month). Can I safely downgrade to Max 5x ($100/month)?"

**The Answer:** This tool analyzes your actual daily message counts against plan limits to give you a clear recommendation.

## Quick Start (2 commands)

```bash
# 1. Clone and setup
git clone https://github.com/yourusername/llm-usage-analyzer.git
cd llm-usage-analyzer
npm run setup

# 2. Start everything
npm start
```

This starts:
- **Web Dashboard** at http://localhost:5173
- **CLI Server** that reads your Claude Code data from `~/.claude/projects/`

Open the dashboard and click **"Analyze My Usage"** - that's it!

## How It Works

Claude subscription plans limit by **messages per day**, not tokens:

| Plan | Messages/Day | Price |
|------|--------------|-------|
| Claude Pro | ~100 | $20/mo |
| Claude Max 5x | ~500 | $100/mo |
| Claude Max 20x | ~2000 | $200/mo |

The analyzer:
1. Scans your local Claude Code session files
2. Counts messages per day
3. Compares against plan limits
4. Tells you if you can downgrade (and how much you'll save)

## Alternative: Manual Commands

If you prefer running commands separately:

```bash
# Start the web dashboard only
npm run dev

# In another terminal, start the CLI server
npm run serve

# Or just export to JSON and upload manually
llm-usage scan
```

## CLI Commands

After running `npm run setup`, you have access to:

```bash
llm-usage serve          # Start local server (dashboard auto-detects)
llm-usage scan           # Export usage to usage_report.json
llm-usage scan --days 30 # Last 30 days only
llm-usage analyze        # Show quick analysis in terminal
```

## Project Structure

```
llm-usage-analyzer/
├── components/          # React components
├── services/            # Analysis logic
├── packages/cli/        # CLI tool
└── package.json
```

## Privacy

Everything runs locally on your machine. No data is sent anywhere. The tool only reads your Claude Code session files from `~/.claude/projects/` and calculates aggregate statistics.

## Requirements

- Node.js 18+
- Claude Code CLI installed (so you have data in `~/.claude/projects/`)
