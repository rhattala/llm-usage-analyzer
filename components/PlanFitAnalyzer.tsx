import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, Cell
} from 'recharts';
import {
  TrendingDown, TrendingUp, CheckCircle, AlertTriangle,
  Calendar, Zap, DollarSign, Info, ArrowRight, ChevronDown
} from 'lucide-react';
import { UsageReport } from '../types';
import { analyzePlanFit, PlanFitResult } from '../services/analysisService';
import { PLAN_LIMITS, PlanLimitKey } from '../constants';

interface PlanFitAnalyzerProps {
  data: UsageReport;
  currentPlan?: PlanLimitKey;
  onPlanChange?: (plan: PlanLimitKey) => void;
}

const PlanFitAnalyzer: React.FC<PlanFitAnalyzerProps> = ({ data, currentPlan, onPlanChange }) => {
  // Use currentPlan from props (controlled by parent)
  const selectedPlan = currentPlan || 'Claude Max 20x';
  const analysis = useMemo(() => analyzePlanFit(data, selectedPlan), [data, selectedPlan]);

  const handlePlanChange = (plan: PlanLimitKey) => {
    if (onPlanChange) {
      onPlanChange(plan);
    }
  };

  // Get bar color based on message count
  const getBarColor = (count: number): string => {
    if (count > PLAN_LIMITS['Claude Max 5x'].messagesPerDay) {
      return '#ef4444'; // red - over Max 5x
    }
    if (count > PLAN_LIMITS['Claude Pro'].messagesPerDay) {
      return '#f59e0b'; // amber - over Pro but under Max 5x
    }
    return '#10b981'; // emerald - under Pro
  };

  // Format date for display
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Prepare chart data (last 30 days or available)
  const chartData = useMemo(() => {
    const data = analysis.dailyUsage.slice(-30).map(day => ({
      date: formatDate(day.date),
      fullDate: day.date,
      messages: day.count,
      color: getBarColor(day.count),
    }));
    return data;
  }, [analysis]);

  // Recommendation styling
  const getRecommendationStyle = () => {
    if (analysis.savings > 0) {
      return {
        bgClass: 'bg-emerald-500/10 border-emerald-500/30',
        iconClass: 'text-emerald-400',
        icon: CheckCircle,
        title: 'You can save money!',
      };
    }
    if (analysis.recommendation === 'max20x' && analysis.currentPlan !== 'Claude Max 20x') {
      return {
        bgClass: 'bg-amber-500/10 border-amber-500/30',
        iconClass: 'text-amber-400',
        icon: AlertTriangle,
        title: 'Consider upgrading',
      };
    }
    return {
      bgClass: 'bg-blue-500/10 border-blue-500/30',
      iconClass: 'text-blue-400',
      icon: CheckCircle,
      title: 'Your plan fits well',
    };
  };

  const recStyle = getRecommendationStyle();
  const RecIcon = recStyle.icon;

  const confidenceLabel = {
    high: { text: 'High confidence', color: 'text-emerald-400' },
    medium: { text: 'Medium confidence', color: 'text-amber-400' },
    low: { text: 'Low confidence', color: 'text-red-400' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-purple-400" />
            Plan Fit Analysis
          </h2>
          <p className="text-slate-400 mt-1">
            Based on your daily message usage vs plan limits
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Plan Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Your plan:</span>
            <div className="relative">
              <select
                value={selectedPlan}
                onChange={(e) => handlePlanChange(e.target.value as PlanLimitKey)}
                className="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <option value="Claude Pro">Claude Pro ($20/mo)</option>
                <option value="Claude Max 5x">Claude Max 5x ($100/mo)</option>
                <option value="Claude Max 20x">Claude Max 20x ($200/mo)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${confidenceLabel[analysis.confidence].color} bg-slate-800 border border-slate-700`}>
            {analysis.totalDays} days • {confidenceLabel[analysis.confidence].text}
          </div>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className={`p-6 rounded-2xl border ${recStyle.bgClass}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl bg-slate-900/50 ${recStyle.iconClass}`}>
            <RecIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">{recStyle.title}</h3>
            <p className="text-slate-300">{analysis.recommendationReason}</p>

            {analysis.savings > 0 && (
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Current:</span>
                  <span className="text-white font-semibold">{analysis.currentPlan}</span>
                  <span className="text-slate-500">${analysis.currentPrice}/mo</span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Recommended:</span>
                  <span className="text-emerald-400 font-semibold">
                    Claude {analysis.recommendation === 'pro' ? 'Pro' : analysis.recommendation === 'max5x' ? 'Max 5x' : 'Max 20x'}
                  </span>
                  <span className="text-slate-500">${analysis.recommendedPrice}/mo</span>
                </div>
              </div>
            )}

            {analysis.savings > 0 && (
              <div className="mt-4 p-4 bg-emerald-500/10 rounded-xl inline-flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <div>
                  <div className="text-emerald-400 font-bold text-2xl">
                    Save ${analysis.savings}/month
                  </div>
                  <div className="text-emerald-400/70 text-sm">
                    That's ${analysis.savings * 12}/year
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-sm mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            Peak Day
          </div>
          <div className="text-2xl font-bold text-white">{analysis.peakMessages}</div>
          <div className="text-xs text-slate-500">{formatDate(analysis.peakDate)}</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-sm mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Daily Average
          </div>
          <div className="text-2xl font-bold text-white">{analysis.avgMessages}</div>
          <div className="text-xs text-slate-500">messages/day</div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-sm mb-1">Days over Pro (100)</div>
          <div className="text-2xl font-bold text-amber-400">
            {analysis.daysOverPro}
            <span className="text-slate-500 text-sm font-normal ml-1">/ {analysis.totalDays}</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="text-slate-400 text-sm mb-1">Days over Max 5x (500)</div>
          <div className="text-2xl font-bold text-red-400">
            {analysis.daysOverMax5x}
            <span className="text-slate-500 text-sm font-normal ml-1">/ {analysis.totalDays}</span>
          </div>
        </div>
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          Daily Message Usage
        </h3>

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
                domain={[0, 'auto']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                formatter={(value: number) => [`${value} messages`, 'Messages']}
                labelFormatter={(label) => `Date: ${label}`}
              />

              {/* Plan limit reference lines */}
              <ReferenceLine
                y={PLAN_LIMITS['Claude Pro'].messagesPerDay}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{
                  value: 'Pro (100)',
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={PLAN_LIMITS['Claude Max 5x'].messagesPerDay}
                stroke="#ef4444"
                strokeDasharray="4 4"
                label={{
                  value: 'Max 5x (500)',
                  position: 'right',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />

              <Bar dataKey="messages" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500"></div>
            <span className="text-slate-400">Under Pro limit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span className="text-slate-400">Over Pro, under Max 5x</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-slate-400">Over Max 5x limit</span>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl text-sm">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-slate-400">
          <strong className="text-slate-300">How this works:</strong> Claude subscription plans limit usage by{' '}
          <strong className="text-white">messages per day</strong>, not by tokens. Pro allows ~100 messages/day,
          Max 5x allows ~500/day, and Max 20x allows ~2000/day. This analysis checks your actual daily message
          counts against these limits.
        </div>
      </div>
    </div>
  );
};

export default PlanFitAnalyzer;
