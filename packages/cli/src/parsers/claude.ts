import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { glob } from 'glob';
import type { ClaudeMessage, UsageReport, ScanOptions } from '../types.js';

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

export interface ParseProgress {
  projectsFound: number;
  filesProcessed: number;
  messagesProcessed: number;
  errors: string[];
}

/**
 * Check if Claude Code data directory exists
 */
export function claudeDataExists(): boolean {
  return fs.existsSync(PROJECTS_DIR);
}

/**
 * Get Claude data directory path
 */
export function getClaudeDataPath(): string {
  return PROJECTS_DIR;
}

/**
 * Parse a single JSONL line
 */
export function parseJsonlLine(line: string): ClaudeMessage | null {
  if (!line.trim()) return null;

  try {
    return JSON.parse(line) as ClaudeMessage;
  } catch {
    return null;
  }
}

/**
 * Check if a timestamp falls within the date range
 */
function isWithinDateRange(
  timestamp: string,
  startDate: Date | null,
  endDate: Date | null
): boolean {
  const date = new Date(timestamp);
  if (startDate && date < startDate) return false;
  if (endDate && date > endDate) return false;
  return true;
}

/**
 * Scan Claude Code local data and aggregate usage
 */
export async function scanClaudeUsage(
  options: ScanOptions = {},
  onProgress?: (progress: ParseProgress) => void
): Promise<{ report: UsageReport; progress: ParseProgress }> {
  const progress: ParseProgress = {
    projectsFound: 0,
    filesProcessed: 0,
    messagesProcessed: 0,
    errors: [],
  };

  // Determine date range
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  if (options.days) {
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(startDate.getDate() - options.days);
  } else if (options.startDate) {
    startDate = new Date(options.startDate);
  }

  if (options.endDate) {
    endDate = new Date(options.endDate);
  }

  // Initialize usage data
  const usage: UsageReport = {
    provider: 'anthropic',
    source: 'local_agent',
    period: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
    plan: {
      name: 'Claude Pro',
      price_usd: 20,
      type: 'subscription',
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
  let minDate = new Date();
  let maxDate = new Date(0);

  if (!claudeDataExists()) {
    progress.errors.push(`Claude projects directory not found: ${PROJECTS_DIR}`);
    return { report: usage, progress };
  }

  try {
    // Find all project directories
    const projectDirs = fs.readdirSync(PROJECTS_DIR).filter((name) => {
      const fullPath = path.join(PROJECTS_DIR, name);
      return fs.statSync(fullPath).isDirectory();
    });

    progress.projectsFound = projectDirs.length;
    onProgress?.(progress);

    // Process each project
    for (const project of projectDirs) {
      const projectPath = path.join(PROJECTS_DIR, project);

      // Find all JSONL files in the project
      const files = await glob('**/*.jsonl', { cwd: projectPath });

      for (const file of files) {
        const filePath = path.join(projectPath, file);
        progress.filesProcessed++;
        usage.usage.sessions.count++;

        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          for (const line of lines) {
            const entry = parseJsonlLine(line);
            if (!entry?.message?.usage) continue;

            const timestamp = entry.timestamp;
            if (timestamp && !isWithinDateRange(timestamp, startDate, endDate)) {
              continue;
            }

            const {
              input_tokens = 0,
              output_tokens = 0,
              cache_read_input_tokens = 0,
              cache_creation_input_tokens = 0,
            } = entry.message.usage;

            const model = entry.message.model || 'unknown';

            // Update date range
            if (timestamp) {
              const ts = new Date(timestamp);
              if (ts < minDate) minDate = ts;
              if (ts > maxDate) maxDate = ts;
            }

            // Aggregate tokens
            usage.usage.tokens.input += input_tokens;
            usage.usage.tokens.output += output_tokens;
            usage.usage.tokens.cached =
              (usage.usage.tokens.cached || 0) + cache_read_input_tokens + cache_creation_input_tokens;

            // By model
            if (!usage.usage.tokens.by_model[model]) {
              usage.usage.tokens.by_model[model] = { input: 0, output: 0 };
            }
            usage.usage.tokens.by_model[model].input += input_tokens;
            usage.usage.tokens.by_model[model].output += output_tokens;

            // Messages & Days
            usage.usage.messages.count++;
            progress.messagesProcessed++;

            if (timestamp) {
              const dateKey = timestamp.split('T')[0];
              if (!dayMap[dateKey]) {
                dayMap[dateKey] = { count: 0, input: 0, output: 0 };
              }
              dayMap[dateKey].count++;
              dayMap[dateKey].input += input_tokens;
              dayMap[dateKey].output += output_tokens;
            }
          }
        } catch (err) {
          if (options.verbose) {
            progress.errors.push(`Error reading ${filePath}: ${err}`);
          }
        }

        onProgress?.(progress);
      }
    }

    // Finalize period
    if (minDate.getTime() !== new Date().getTime()) {
      usage.period.start = minDate.toISOString();
    }
    if (maxDate.getTime() !== new Date(0).getTime()) {
      usage.period.end = maxDate.toISOString();
    }

    // Convert day map to array
    usage.usage.messages.by_day = Object.entries(dayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

  } catch (err) {
    progress.errors.push(`Error scanning projects: ${err}`);
  }

  return { report: usage, progress };
}

/**
 * Format token count for display
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(2)}M`;
  } else if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1)}K`;
  }
  return count.toString();
}
