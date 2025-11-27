# Contributing to LLM Usage Analyzer

Thanks for your interest in contributing! This project helps Claude users understand their usage patterns and choose the right subscription plan.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/rhattala/llm-usage-analyzer.git
cd llm-usage-analyzer

# Install and setup
npm run setup

# Start development (web + CLI server)
npm start
```

## Project Structure

```
llm-usage-analyzer/
├── App.tsx                 # Main React app
├── components/             # React components
│   ├── Uploader.tsx        # File upload + server detection
│   ├── AnalysisDashboard.tsx  # Main dashboard
│   ├── PlanFitAnalyzer.tsx    # Plan recommendation
│   └── ...
├── services/               # Business logic
│   ├── analysisService.ts  # Usage calculations
│   └── storageService.ts   # LocalStorage management
├── packages/
│   └── cli/                # CLI tool (llm-usage command)
│       └── src/
│           ├── commands/   # CLI commands
│           └── parsers/    # Claude data parsers
└── constants.ts            # Plan limits, mock data
```

## How to Contribute

### Report Bugs
- Open an issue with steps to reproduce
- Include your OS and Node version
- Attach a screenshot if relevant

### Suggest Features
- Open a feature request issue
- Explain the use case
- Bonus: include a mockup or example

### Submit Code

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test locally with `npm start`
5. Commit with a clear message
6. Open a PR

### Code Style

- TypeScript for all new code
- Functional React components with hooks
- Tailwind CSS for styling
- Keep PRs focused - one feature per PR

## Ideas for Contributions

Here are some areas where help is welcome:

### Easy (Good First Issues)
- [ ] Add dark/light mode toggle
- [ ] Improve mobile responsiveness
- [ ] Add more export formats (Markdown, Excel)
- [ ] Better error messages for invalid files

### Medium
- [ ] Support for OpenAI/ChatGPT usage data
- [ ] Add cost projections for future usage
- [ ] Weekly/monthly usage summaries
- [ ] Browser extension for automatic data collection

### Advanced
- [ ] Multi-provider comparison (Claude vs GPT vs etc)
- [ ] Usage anomaly detection
- [ ] Team/organization usage aggregation
- [ ] API rate limit predictions

## Questions?

Open an issue or start a discussion. We're happy to help!
