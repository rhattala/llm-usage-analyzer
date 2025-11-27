import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, 
  AlertTriangle, BrainCircuit, RefreshCw 
} from 'lucide-react';
import { UsageReport, AnalysisResult } from '../types';
import { calculateAnalysis, formatTokenNumber } from '../services/analysisService';
import { getGeminiRecommendation } from '../services/geminiService';

interface DashboardProps {
  data: UsageReport;
  onReset: () => void;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
}> = ({ title, value, subtitle, icon, trend, colorClass = "text-white" }) => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-700/30 rounded-lg text-slate-300">
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
          trend === 'down' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          {trend === 'down' ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
          {trend === 'down' ? 'Saving' : 'Costly'}
        </span>
      )}
    </div>
    <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
    {subtitle && <p className="text-slate-500 text-xs mt-2">{subtitle}</p>}
  </div>
);

const AnalysisDashboard: React.FC<DashboardProps> = ({ data, onReset }) => {
  const analysis = useMemo(() => calculateAnalysis(data), [data]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    // Auto-trigger simple analysis or wait for user? Let's wait for user interaction or load immediately if small
    // For this demo, let's load it on mount
    const fetchAi = async () => {
      setLoadingAi(true);
      const result = await getGeminiRecommendation(data, analysis);
      setAiAnalysis(result);
      setLoadingAi(false);
    };
    fetchAi();
  }, [data, analysis]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Usage Analysis
            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
              {data.source === 'demo' ? 'DEMO MODE' : 'LIVE DATA'}
            </span>
          </h2>
          <p className="text-slate-400 text-sm">
            Period: {new Date(data.period.start).toLocaleDateString()} - {new Date(data.period.end).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Upload New Data
        </button>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Current Plan Cost"
          value={`$${analysis.currentMonthlyCost.toFixed(2)}`}
          subtitle={`Plan: ${data.plan.name}`}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard 
          title="API Equivalent"
          value={`$${analysis.apiEquivalentCost.toFixed(2)}`}
          subtitle="Pay-as-you-go Value"
          icon={<Activity className="w-5 h-5" />}
          trend={analysis.isOverpaying ? 'down' : 'up'}
          colorClass={analysis.isOverpaying ? 'text-green-400' : 'text-red-400'}
        />
        <StatCard 
          title="Monthly Savings"
          value={analysis.isOverpaying ? `$${analysis.savings.toFixed(2)}` : `-$${analysis.savings.toFixed(2)}`}
          subtitle={analysis.isOverpaying ? "If you switch to API" : "You are saving money!"}
          icon={<TrendingDown className="w-5 h-5" />}
          colorClass={analysis.isOverpaying ? 'text-green-400' : 'text-slate-200'}
        />
        <StatCard 
          title="Recommendation"
          value={analysis.recommendedPlan === "API (Pay-As-You-Go)" ? "Switch to API" : "Keep Plan"}
          subtitle="Based on strict cost"
          icon={<BrainCircuit className="w-5 h-5" />}
          colorClass="text-indigo-400"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Usage Chart */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Daily Token Usage</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.usage.messages.by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).getDate().toString()} 
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickFormatter={(val) => `${(val/1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    cursor={{ fill: '#334155', opacity: 0.4 }}
                    formatter={(value: number) => [formatTokenNumber(value), 'Tokens']}
                  />
                  <Bar dataKey="input" name="Input" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="output" name="Output" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Model Distribution</h3>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.modelBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {analysis.modelBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                       formatter={(value: number) => formatTokenNumber(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {analysis.modelBreakdown.map((entry, index) => (
                  <div key={index} className="flex items-center text-xs text-slate-400">
                    <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    {entry.name}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
               <h3 className="text-lg font-semibold text-white mb-4">Input vs Output</h3>
               <div className="flex flex-col h-full justify-center space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-400">Input (Context)</span>
                      <span className="text-white">{formatTokenNumber(data.usage.tokens.input)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full" 
                        style={{ width: `${(data.usage.tokens.input / (data.usage.tokens.input + data.usage.tokens.output)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-400">Output (Generation)</span>
                      <span className="text-white">{formatTokenNumber(data.usage.tokens.output)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full" 
                        style={{ width: `${(data.usage.tokens.output / (data.usage.tokens.input + data.usage.tokens.output)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-4">
                    High input ratio suggests RAG or context-heavy usage. High output ratio suggests creative writing or coding generation.
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 sticky top-8">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-6 h-6 text-indigo-400" />
              <h3 className="text-xl font-bold text-white">AI Advisor</h3>
            </div>
            
            <div className="min-h-[200px] text-slate-300 text-sm leading-relaxed space-y-4">
              {loadingAi ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <span className="text-indigo-300">Analyzing usage patterns...</span>
                </div>
              ) : (
                aiAnalysis ? (
                   <div className="whitespace-pre-line font-light">
                     {aiAnalysis}
                   </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Could not generate insight.
                  </div>
                )
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-indigo-500/30">
              <h4 className="text-indigo-200 font-medium mb-2">Verdict</h4>
              <div className={`p-3 rounded-lg text-center font-bold ${
                analysis.isOverpaying 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600'
              }`}>
                {analysis.isOverpaying 
                  ? `Switch & Save $${analysis.savings.toFixed(2)}/mo` 
                  : "Keep Current Plan"}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisDashboard;
