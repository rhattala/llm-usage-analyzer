import React, { useMemo } from 'react';
import { Check, X, Crown, TrendingDown, AlertCircle, Sparkles } from 'lucide-react';
import { UsageReport, PlanInfo } from '../types';
import { PLANS_DATABASE, MODEL_PRICING } from '../constants';

interface PlanComparisonProps {
  data: UsageReport;
  onClose?: () => void;
}

interface PlanCostEstimate {
  plan: PlanInfo;
  monthlyCost: number;
  isCurrentPlan: boolean;
  savings: number;
  meetsUsage: boolean;
  warnings: string[];
}

const PlanComparison: React.FC<PlanComparisonProps> = ({ data, onClose }) => {
  const estimates = useMemo(() => {
    return calculatePlanEstimates(data);
  }, [data]);

  const currentPlan = estimates.find(e => e.isCurrentPlan);
  const bestPlan = estimates.filter(e => e.meetsUsage).sort((a, b) => a.monthlyCost - b.monthlyCost)[0];
  const potentialSavings = currentPlan && bestPlan
    ? Math.max(0, currentPlan.monthlyCost - bestPlan.monthlyCost)
    : 0;

  // Group plans by provider
  const anthropicPlans = estimates.filter(e => e.plan.provider === 'anthropic');
  const openaiPlans = estimates.filter(e => e.plan.provider === 'openai');
  const googlePlans = estimates.filter(e => e.plan.provider === 'google');
  const otherPlans = estimates.filter(e => e.plan.provider === 'other' || e.plan.provider === 'xai');

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Plan Comparison</h2>
            <p className="text-sm text-slate-400 mt-1">
              Based on your usage of {formatNumber(data.usage.tokens.input + data.usage.tokens.output)} tokens
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Potential Savings Banner */}
        {potentialSavings > 5 && bestPlan && !bestPlan.isCurrentPlan && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-green-400 font-semibold">
                  Save ${potentialSavings.toFixed(2)}/month
                </div>
                <div className="text-sm text-slate-400">
                  Switch to <span className="text-white font-medium">{bestPlan.plan.name}</span> for optimal savings
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plan Grid */}
      <div className="p-6 space-y-8">
        {/* Anthropic Plans */}
        {anthropicPlans.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-orange-500/20 flex items-center justify-center text-xs">A</span>
              Anthropic Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {anthropicPlans.map((estimate) => (
                <PlanCard
                  key={estimate.plan.name}
                  estimate={estimate}
                  isBest={bestPlan?.plan.name === estimate.plan.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* OpenAI Plans */}
        {openaiPlans.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-green-500/20 flex items-center justify-center text-xs">O</span>
              OpenAI Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openaiPlans.map((estimate) => (
                <PlanCard
                  key={estimate.plan.name}
                  estimate={estimate}
                  isBest={bestPlan?.plan.name === estimate.plan.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* Google Gemini Plans */}
        {googlePlans.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center text-xs">G</span>
              Google Gemini Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {googlePlans.map((estimate) => (
                <PlanCard
                  key={estimate.plan.name}
                  estimate={estimate}
                  isBest={bestPlan?.plan.name === estimate.plan.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* xAI Grok Plans */}
        {otherPlans.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-slate-500/20 flex items-center justify-center text-xs">X</span>
              xAI Grok Plans
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {otherPlans.map((estimate) => (
                <PlanCard
                  key={estimate.plan.name}
                  estimate={estimate}
                  isBest={bestPlan?.plan.name === estimate.plan.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Summary */}
      <div className="px-6 pb-6">
        <div className="bg-slate-900/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-slate-400 mb-3">Your Usage Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-slate-500">Input Tokens</div>
              <div className="text-white font-medium">{formatNumber(data.usage.tokens.input)}</div>
            </div>
            <div>
              <div className="text-slate-500">Output Tokens</div>
              <div className="text-white font-medium">{formatNumber(data.usage.tokens.output)}</div>
            </div>
            <div>
              <div className="text-slate-500">Messages</div>
              <div className="text-white font-medium">{data.usage.messages.count}</div>
            </div>
            <div>
              <div className="text-slate-500">Period</div>
              <div className="text-white font-medium">{getDaysInPeriod(data)} days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PlanCardProps {
  estimate: PlanCostEstimate;
  isBest: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({ estimate, isBest }) => {
  const { plan, monthlyCost, isCurrentPlan, meetsUsage, warnings } = estimate;

  return (
    <div
      className={`relative rounded-xl p-4 transition-all ${
        isBest
          ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-2 border-indigo-500/50 ring-2 ring-indigo-500/20'
          : isCurrentPlan
          ? 'bg-slate-700/50 border border-indigo-500/30'
          : 'bg-slate-800/50 border border-white/5 hover:border-white/10'
      }`}
    >
      {/* Badges */}
      <div className="absolute -top-2 -right-2 flex gap-1">
        {isBest && (
          <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" /> Best
          </span>
        )}
        {isCurrentPlan && !isBest && (
          <span className="px-2 py-0.5 bg-slate-600 text-white text-xs font-medium rounded-full">
            Current
          </span>
        )}
      </div>

      {/* Plan Name */}
      <h4 className="font-semibold text-white mb-1">{plan.name}</h4>
      <div className="text-xs text-slate-400 mb-3">
        {plan.type === 'subscription' ? 'Subscription' : 'Pay-As-You-Go'}
      </div>

      {/* Cost */}
      <div className="mb-3">
        <span className="text-2xl font-bold text-white">${monthlyCost.toFixed(2)}</span>
        <span className="text-slate-400 text-sm">/month</span>
      </div>

      {/* Features / Status */}
      <div className="space-y-1.5">
        {plan.type === 'subscription' && (
          <div className="flex items-center gap-2 text-xs">
            {meetsUsage ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-slate-300">Covers your usage</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400">May exceed limits</span>
              </>
            )}
          </div>
        )}

        {plan.limits?.estimated_messages_per_day && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5" />
            ~{plan.limits.estimated_messages_per_day} messages/day
          </div>
        )}

        {plan.type === 'payg' && (
          <div className="text-xs text-slate-400">
            Based on actual token usage
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5">
          {warnings.map((warning, i) => (
            <div key={i} className="text-xs text-amber-400 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function calculatePlanEstimates(data: UsageReport): PlanCostEstimate[] {
  const estimates: PlanCostEstimate[] = [];
  const daysInPeriod = getDaysInPeriod(data);
  const avgMessagesPerDay = data.usage.messages.count / Math.max(daysInPeriod, 1);

  for (const plan of PLANS_DATABASE) {
    let monthlyCost = 0;
    let meetsUsage = true;
    const warnings: string[] = [];

    if (plan.type === 'subscription') {
      monthlyCost = plan.price_usd;

      // Check if usage fits within plan limits
      if (plan.limits?.estimated_messages_per_day) {
        if (avgMessagesPerDay > plan.limits.estimated_messages_per_day) {
          meetsUsage = false;
          warnings.push(`Your ${avgMessagesPerDay.toFixed(0)} msg/day may exceed the ~${plan.limits.estimated_messages_per_day}/day limit`);
        }
      }
    } else {
      // PAYG - calculate actual cost based on tokens
      monthlyCost = calculatePaygCost(data, plan);
    }

    const isCurrentPlan =
      data.plan.name.toLowerCase().includes(plan.name.toLowerCase()) ||
      plan.name.toLowerCase().includes(data.plan.name.toLowerCase());

    estimates.push({
      plan,
      monthlyCost,
      isCurrentPlan,
      savings: 0, // Will calculate later
      meetsUsage,
      warnings,
    });
  }

  // Calculate savings relative to current plan
  const currentPlan = estimates.find(e => e.isCurrentPlan);
  if (currentPlan) {
    for (const estimate of estimates) {
      estimate.savings = currentPlan.monthlyCost - estimate.monthlyCost;
    }
  }

  return estimates;
}

function calculatePaygCost(data: UsageReport, plan: PlanInfo): number {
  let totalCost = 0;
  const daysInPeriod = getDaysInPeriod(data);
  const monthlyMultiplier = 30 / Math.max(daysInPeriod, 1);

  // Calculate based on model-specific pricing
  for (const [model, tokens] of Object.entries(data.usage.tokens.by_model)) {
    const pricing = plan.pricing?.by_model?.[model]
      || MODEL_PRICING[model]
      || { input: plan.pricing?.input_per_1m_tokens || 5, output: plan.pricing?.output_per_1m_tokens || 20 };

    const inputCost = (tokens.input / 1_000_000) * pricing.input;
    const outputCost = (tokens.output / 1_000_000) * pricing.output;

    totalCost += inputCost + outputCost;
  }

  // If no model breakdown, use totals with default pricing
  if (Object.keys(data.usage.tokens.by_model).length === 0) {
    const defaultPricing = {
      input: plan.pricing?.input_per_1m_tokens || 5,
      output: plan.pricing?.output_per_1m_tokens || 20,
    };
    totalCost = (data.usage.tokens.input / 1_000_000) * defaultPricing.input
      + (data.usage.tokens.output / 1_000_000) * defaultPricing.output;
  }

  // Project to monthly
  return totalCost * monthlyMultiplier;
}

function getDaysInPeriod(data: UsageReport): number {
  const start = new Date(data.period.start);
  const end = new Date(data.period.end);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export default PlanComparison;
