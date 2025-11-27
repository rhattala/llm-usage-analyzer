import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  AlertTriangle, BrainCircuit, RefreshCw, Scale, Download, FileText, FileSpreadsheet, Copy, Check, Zap, Radio, ChevronDown
} from 'lucide-react';
import { UsageReport, AnalysisResult } from '../types';
import { calculateAnalysis, formatTokenNumber } from '../services/analysisService';
import { getGeminiRecommendation } from '../services/geminiService';
import PlanComparison from './PlanComparison';
import PlanFitAnalyzer from './PlanFitAnalyzer';
import { exportToJSON, exportToCSV, exportToPDF, copyToClipboard } from '../services/exportService';
import { PLAN_LIMITS, PlanLimitKey } from '../constants';

interface DashboardProps {
  data: UsageReport;
  onReset: () => void;
  isLiveData?: boolean;
  liveServerConnected?: boolean;
  onLiveRefresh?: () => Promise<void>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

const StatCard: React.FC<{ 
  title: string; 
  value: string; 
  subtitle?: string; 
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  colorClass?: string;
  delay?: number;
}> = ({ title, value, subtitle, icon, trend, colorClass = "text-white", delay = 0 }) => (
  <div 
    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm 
               hover:bg-slate-800 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300
               animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
    style={{ animationDuration: '700ms', animationDelay: `${delay}ms` }}
  >
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

const AnalysisDashboard: React.FC<DashboardProps> = ({ data, onReset, isLiveData, liveServerConnected, onLiveRefresh }) => {
  const analysis = useMemo(() => calculateAnalysis(data), [data]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [showPlanFit, setShowPlanFit] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Global plan selection - persisted to localStorage
  const [selectedPlan, setSelectedPlan] = useState<PlanLimitKey>(() => {
    const saved = localStorage.getItem('selectedPlan');
    return (saved as PlanLimitKey) || 'Claude Max 20x';
  });

  // Persist plan selection
  useEffect(() => {
    localStorage.setItem('selectedPlan', selectedPlan);
  }, [selectedPlan]);

  const handleRefresh = async () => {
    if (!onLiveRefresh) return;
    setIsRefreshing(true);
    await onLiveRefresh();
    setIsRefreshing(false);
  };

  // Determine if data spans multiple months for better X-axis formatting
  const dateRange = useMemo(() => {
    const days = data.usage.messages.by_day;
    if (days.length === 0) return { spansMultipleMonths: false, months: new Set<string>() };
    const months = new Set(days.map(d => new Date(d.date).toISOString().slice(0, 7)));
    return { spansMultipleMonths: months.size > 1, months };
  }, [data]);

  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (dateRange.spansMultipleMonths) {
      // Show "Jan 15" format for multi-month data
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // Just show day number for single month
    return date.getDate().toString();
  };

  const handleExport = (format: 'json' | 'csv' | 'pdf') => {
    setShowExportMenu(false);
    switch (format) {
      case 'json':
        exportToJSON(data);
        break;
      case 'csv':
        exportToCSV(data);
        break;
      case 'pdf':
        exportToPDF(data);
        break;
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(data);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Usage Analysis
            {isLiveData && liveServerConnected ? (
              <span className="text-xs font-medium text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/30 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                LIVE DATA
              </span>
            ) : isLiveData && !liveServerConnected ? (
              <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                DISCONNECTED
              </span>
            ) : data.source === 'demo' ? (
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                DEMO MODE
              </span>
            ) : (
              <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-1 rounded-full border border-slate-700">
                UPLOADED
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm">
            Period: {new Date(data.period.start).toLocaleDateString()} - {new Date(data.period.end).toLocaleDateString()}
          </p>
          {/* Global Plan Selector */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">Your plan:</span>
            <div className="relative">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value as PlanLimitKey)}
                className="appearance-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 pr-8 text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:bg-slate-700 transition-colors"
              >
                <option value="Claude Pro">Claude Pro ($20/mo)</option>
                <option value="Claude Max 5x">Claude Max 5x ($100/mo)</option>
                <option value="Claude Max 20x">Claude Max 20x ($200/mo)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Button - Live Mode Only */}
          {isLiveData && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !liveServerConnected}
              className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                liveServerConnected
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
              title={liveServerConnected ? 'Refresh data from server' : 'Server disconnected'}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}

          {/* Plan Fit Button - Most Important */}
          <button
            onClick={() => { setShowPlanFit(!showPlanFit); if (!showPlanFit) setShowPlanComparison(false); }}
            className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
              showPlanFit
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/30'
            }`}
          >
            <Zap className="w-4 h-4" /> Plan Fit
          </button>

          {/* Compare Plans Button */}
          <button
            onClick={() => { setShowPlanComparison(!showPlanComparison); if (!showPlanComparison) setShowPlanFit(false); }}
            className={`text-sm flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPlanComparison
                ? 'bg-indigo-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Scale className="w-4 h-4" /> Compare Plans
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Export
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    Print / Save as PDF
                  </button>
                  <div className="border-t border-white/5" />
                  <button
                    onClick={handleCopy}
                    className="w-full px-4 py-3 text-left text-sm text-slate-300 hover:bg-white/5 flex items-center gap-3"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={onReset}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-2 px-4 py-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> New
          </button>
        </div>
      </div>

      {/* Plan Fit Analysis Panel */}
      {showPlanFit && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <PlanFitAnalyzer data={data} currentPlan={selectedPlan} onPlanChange={setSelectedPlan} />
        </div>
      )}

      {/* Plan Comparison Panel */}
      {showPlanComparison && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <PlanComparison data={data} onClose={() => setShowPlanComparison(false)} />
        </div>
      )}

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Your Plan Cost"
          value={`$${PLAN_LIMITS[selectedPlan].price}/mo`}
          subtitle={selectedPlan}
          icon={<DollarSign className="w-5 h-5" />}
          delay={0}
        />
        <StatCard 
          title="API Equivalent"
          value={`$${analysis.apiEquivalentCost.toFixed(2)}`}
          subtitle="Pay-as-you-go Value"
          icon={<Activity className="w-5 h-5" />}
          trend={analysis.isOverpaying ? 'down' : 'up'}
          colorClass={analysis.isOverpaying ? 'text-green-400' : 'text-red-400'}
          delay={100}
        />
        <StatCard 
          title="Monthly Savings"
          value={analysis.isOverpaying ? `$${analysis.savings.toFixed(2)}` : `-$${analysis.savings.toFixed(2)}`}
          subtitle={analysis.isOverpaying ? "If you switch to API" : "You are saving money!"}
          icon={<TrendingDown className="w-5 h-5" />}
          colorClass={analysis.isOverpaying ? 'text-green-400' : 'text-slate-200'}
          delay={200}
        />
        <StatCard 
          title="Recommendation"
          value={analysis.recommendedPlan === "API (Pay-As-You-Go)" ? "Switch to API" : "Keep Plan"}
          subtitle="Based on strict cost"
          icon={<BrainCircuit className="w-5 h-5" />}
          colorClass="text-indigo-400"
          delay={300}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Daily Usage Chart */}
          <div 
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
            style={{ animationDelay: '400ms' }}
          >
            <h3 className="text-lg font-semibold text-white mb-6">Daily Token Usage</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.usage.messages.by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatXAxisDate}
                    stroke="#94a3b8"
                    fontSize={12}
                    interval={dateRange.spansMultipleMonths ? 'preserveStartEnd' : 0}
                    angle={dateRange.spansMultipleMonths ? -45 : 0}
                    textAnchor={dateRange.spansMultipleMonths ? 'end' : 'middle'}
                    height={dateRange.spansMultipleMonths ? 60 : 30}
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
                  <Bar dataKey="input" name="Input" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} animationDuration={1500} />
                  <Bar dataKey="output" name="Output" stackId="a" fill="#34d399" radius={[4, 4, 0, 0]} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Model Breakdown & Ratio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
              style={{ animationDelay: '500ms' }}
            >
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
                      animationDuration={1500}
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

            <div 
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-backwards"
              style={{ animationDelay: '600ms' }}
            >
               <h3 className="text-lg font-semibold text-white mb-4">Input vs Output</h3>
               <div className="flex flex-col h-full justify-center space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-indigo-400">Input (Context)</span>
                      <span className="text-white">{formatTokenNumber(data.usage.tokens.input)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-2 rounded-full animate-in slide-in-from-left duration-1000" 
                        style={{ width: `${(data.usage.tokens.input / (data.usage.tokens.input + data.usage.tokens.output)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-400">Output (Generation)</span>
                      <span className="text-white">{formatTokenNumber(data.usage.tokens.output)}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full animate-in slide-in-from-left duration-1000" 
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
        <div 
          className="lg:col-span-1 space-y-4 animate-in fade-in slide-in-from-right-8 duration-700 fill-mode-backwards"
          style={{ animationDelay: '700ms' }}
        >
          <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-xl p-6 sticky top-8 backdrop-blur-sm shadow-xl shadow-indigo-500/5">
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
                   <div className="whitespace-pre-line font-light animate-in fade-in duration-500">
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
              <div className={`p-3 rounded-lg text-center font-bold transition-all duration-500 ${
                analysis.isOverpaying 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]' 
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