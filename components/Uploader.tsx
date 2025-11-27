import React, { useState } from 'react';
import { 
  Upload, Play, Terminal, Key, FileJson, Copy, Check, 
  Bot, Sparkles, ChevronRight, Download, Server, AlertCircle, 
  ArrowLeft, ShieldCheck, FileUp, Lock, EyeOff
} from 'lucide-react';
import { UsageReport } from '../types';
import { COLLECTOR_SCRIPT_TEMPLATE } from '../constants';

interface UploaderProps {
  onDataLoaded: (data: UsageReport) => void;
  onLoadDemo: () => void;
}

type ViewState = 'main' | 'anthropic-options' | 'anthropic-cli' | 'anthropic-web' | 'openai' | 'upload';

const Uploader: React.FC<UploaderProps> = ({ onDataLoaded, onLoadDemo }) => {
  const [view, setView] = useState<ViewState>('main');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');

  // --- Logic Helpers ---

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  const convertClaudeExportToUsageReport = (data: any[]): UsageReport => {
    const usage: UsageReport = {
      provider: 'anthropic',
      source: 'manual_upload',
      period: { start: new Date().toISOString(), end: new Date().toISOString() },
      plan: { name: 'Claude Pro', price_usd: 20, type: 'subscription' },
      usage: {
        tokens: { input: 0, output: 0, cached: 0, by_model: {} },
        messages: { count: 0, by_day: [] },
        sessions: { count: data.length }
      }
    };

    let minDate = new Date();
    let maxDate = new Date(0);
    const dayMap: Record<string, { count: number; input: number; output: number }> = {};

    data.forEach((conversation: any) => {
      const created = new Date(conversation.created_at || Date.now());
      if (created < minDate) minDate = created;
      if (created > maxDate) maxDate = created;

      const dateKey = created.toISOString().split('T')[0];
      if (!dayMap[dateKey]) dayMap[dateKey] = { count: 0, input: 0, output: 0 };

      const messages = conversation.chat_messages || [];
      messages.forEach((msg: any) => {
        const text = msg.text || '';
        const tokens = estimateTokens(text);
        
        if (msg.sender === 'human') {
          usage.usage.tokens.input += tokens;
          dayMap[dateKey].input += tokens;
        } else {
          usage.usage.tokens.output += tokens;
          dayMap[dateKey].output += tokens;
        }
        dayMap[dateKey].count++;
        usage.usage.messages.count++;
      });
    });

    usage.period.start = minDate.toISOString();
    usage.period.end = maxDate.toISOString();
    usage.usage.messages.by_day = Object.entries(dayMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));
      
    usage.usage.tokens.by_model['claude-3-5-sonnet-estimated'] = {
      input: usage.usage.tokens.input,
      output: usage.usage.tokens.output
    };

    return usage;
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      if (json.usage && json.provider) {
        onDataLoaded(json as UsageReport);
        return;
      }
      
      if (Array.isArray(json) && json.length > 0 && (json[0].uuid || json[0].chat_messages)) {
        const report = convertClaudeExportToUsageReport(json);
        onDataLoaded(report);
        return;
      }

      throw new Error("Unknown JSON format");
    } catch (err) {
      console.error(err);
      setError("Failed to parse file. Please ensure it is a valid 'usage_report.json' or 'conversations.json' export.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(COLLECTOR_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApiKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("Direct API connection is a Pro feature. Please use the Local Agent script for now.");
  };

  const goBack = () => {
    setError(null);
    if (view === 'anthropic-cli' || view === 'anthropic-web') {
      setView('anthropic-options');
    } else {
      setView('main');
    }
  };

  // --- UI Components ---

  const OptionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    colorClass: string;
    bgHoverClass: string;
  }> = ({ icon, title, description, onClick, colorClass, bgHoverClass }) => (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-start p-6 h-full rounded-2xl bg-slate-800/40 border border-white/5 
        hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20
        ${bgHoverClass} text-left w-full overflow-hidden`}
    >
      <div className={`p-3 rounded-xl bg-slate-900/50 mb-4 ${colorClass} group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed flex-1">{description}</p>
      <div className={`mt-6 flex items-center text-xs font-semibold uppercase tracking-wider ${colorClass} opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300`}>
        Select Option <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-4 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center space-y-6 pt-8 mb-16 animate-in fade-in slide-in-from-top-8 duration-700">
          
          {/* Security Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-3 h-3" />
            <span>Privacy First: Analysis runs locally in your browser</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-sm">
            Analyze your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">AI Spending</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Connect your usage data to visualize costs, find hidden patterns, and determine if you should switch to pay-as-you-go.
          </p>
        </div>

        {/* Main Interface Container */}
        <div className="relative min-h-[500px] w-full max-w-4xl mx-auto">
          {/* Content Wrapper with Animations */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl ring-1 ring-white/5 relative overflow-hidden transition-all duration-500">
            
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            
            {/* Navigation Header (if not on main) */}
            {view !== 'main' && (
              <div className="flex items-center gap-4 mb-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <button 
                  onClick={goBack}
                  className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="h-6 w-px bg-white/10"></div>
                <h2 className="text-xl font-semibold text-white">
                  {view === 'anthropic-options' ? 'Anthropic Source' :
                   view === 'anthropic-cli' ? 'Local Workbench' :
                   view === 'anthropic-web' ? 'Claude.ai Export' :
                   view === 'openai' ? 'OpenAI Connection' : 'Upload File'}
                </h2>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-3/4 z-20 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3 shadow-lg backdrop-blur-md">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  {error}
                  <button onClick={() => setError(null)} className="ml-auto hover:text-white">✕</button>
                </div>
              </div>
            )}

            {/* VIEW: MAIN */}
            {view === 'main' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                <OptionCard 
                  icon={<Bot className="w-8 h-8" />}
                  title="Anthropic / Claude"
                  description="Analyze usage from Claude Code CLI sessions or your web chat history. No API key needed."
                  onClick={() => setView('anthropic-options')}
                  colorClass="text-orange-400"
                  bgHoverClass="hover:bg-orange-500/5"
                />
                <OptionCard 
                  icon={<Sparkles className="w-8 h-8" />}
                  title="OpenAI / ChatGPT"
                  description="Connect via API key to fetch detailed usage logs directly."
                  onClick={() => setView('openai')}
                  colorClass="text-emerald-400"
                  bgHoverClass="hover:bg-emerald-500/5"
                />
                <OptionCard 
                  icon={<FileUp className="w-8 h-8" />}
                  title="Upload Report"
                  description="Already have a usage_report.json? Drop it here to visualize."
                  onClick={() => setView('upload')}
                  colorClass="text-blue-400"
                  bgHoverClass="hover:bg-blue-500/5"
                />
              </div>
            )}

            {/* VIEW: ANTHROPIC OPTIONS */}
            {view === 'anthropic-options' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
                <OptionCard 
                  icon={<Terminal className="w-8 h-8" />}
                  title="Local Workbench (CLI)"
                  description="Scan your local ~/.claude folder to analyze coding agent usage. Runs 100% locally."
                  onClick={() => setView('anthropic-cli')}
                  colorClass="text-indigo-400"
                  bgHoverClass="hover:bg-indigo-500/5"
                />
                <OptionCard 
                  icon={<Server className="w-8 h-8" />}
                  title="Web Chat Export"
                  description="Upload conversations.json from your Claude.ai account export."
                  onClick={() => setView('anthropic-web')}
                  colorClass="text-purple-400"
                  bgHoverClass="hover:bg-purple-500/5"
                />
              </div>
            )}

            {/* VIEW: CLI SETUP */}
            {view === 'anthropic-cli' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">Run the Collector Agent</h3>
                    <p className="text-slate-400 leading-relaxed">
                      This secure script scans your local Claude projects to summarize usage. 
                    </p>
                    {/* Security Explanation */}
                    <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex gap-3">
                      <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="text-xs text-slate-300 leading-relaxed">
                        <strong className="text-emerald-400 block mb-1">Why this is secure</strong>
                        The script runs entirely on your machine. No code, prompts, or sensitive files are uploaded to our servers. Only the final token counts are generated.
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                     <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">1</div>
                       <p className="text-sm text-slate-300">Copy the Node.js script code</p>
                     </div>
                     <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">2</div>
                       <p className="text-sm text-slate-300">Run it: <code>node scan_usage.js</code></p>
                     </div>
                     <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
                       <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">3</div>
                       <p className="text-sm text-slate-300">Upload the <code>usage_report.json</code></p>
                     </div>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden group shadow-2xl relative">
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm sticky top-0">
                    <span className="text-xs font-mono text-slate-500">scan_usage.js</span>
                    <button 
                      onClick={copyScript}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 hover:text-white transition-colors bg-indigo-500/10 hover:bg-indigo-500 px-3 py-1.5 rounded-md"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy Code'}
                    </button>
                  </div>
                  <div className="relative">
                    <pre className="p-4 text-[10px] leading-4 font-mono text-slate-300 overflow-auto max-h-[250px] custom-scrollbar selection:bg-indigo-500/30">
                      {COLLECTOR_SCRIPT_TEMPLATE}
                    </pre>
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-slate-950/80"></div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: OPENAI FORM */}
            {view === 'openai' && (
              <div className="max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-500 py-8">
                 <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                    <Key className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Connect OpenAI API</h3>
                  <p className="text-slate-400 mt-2 text-sm">
                    Enter a read-only API key. We'll fetch your usage history securely.
                  </p>
                </div>

                <form onSubmit={handleApiKeySubmit} className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="password" 
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-4 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-50 group-focus-within:opacity-100 transition-opacity">
                       <span className="text-[10px] font-bold tracking-wider text-emerald-500/80 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/20">API KEY</span>
                    </div>
                  </div>
                  <p className="text-xs text-center text-slate-500 flex items-center justify-center gap-1">
                    <EyeOff className="w-3 h-3" />
                    Key is used once for fetching and never stored.
                  </p>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Fetch Usage History <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* VIEW: UPLOAD / DROPZONE */}
            {(view === 'upload' || view === 'anthropic-web' || view === 'anthropic-cli') && (
              <div className={`mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-px bg-slate-800 flex-1"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {view === 'anthropic-cli' ? 'Step 2: Upload Report' : 'Drop File Here'}
                  </span>
                  <div className="h-px bg-slate-800 flex-1"></div>
                </div>

                <div 
                  className={`relative w-full border-2 border-dashed rounded-2xl p-10 transition-all duration-300 ease-out flex flex-col items-center justify-center text-center group
                    ${dragActive 
                      ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01] shadow-2xl shadow-indigo-500/20' 
                      : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/30'
                    }
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    onChange={handleChange}
                    accept=".json"
                  />
                  
                  <div className={`p-4 rounded-xl mb-4 transition-all duration-300 ${dragActive ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-slate-700'}`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1">
                    {dragActive ? 'Drop to Upload' : 'Drag & drop file here'}
                  </h3>
                  <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                    {view === 'anthropic-web' 
                      ? 'Upload conversations.json. Processing happens locally in your browser.' 
                      : 'Supports usage_report.json or standard JSON exports. No data leaves your device.'}
                  </p>
                  
                  <label 
                    htmlFor="file-upload" 
                    className="px-6 py-2.5 bg-slate-200 hover:bg-white text-slate-900 font-semibold rounded-lg cursor-pointer transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    Select File
                  </label>
                </div>
              </div>
            )}

          </div>

          {/* Demo Button Footer */}
          <div className="flex justify-center mt-8">
             <button 
              onClick={onLoadDemo}
              className="group flex items-center gap-2 px-5 py-2 text-slate-500 hover:text-indigo-300 transition-all text-sm font-medium rounded-full hover:bg-slate-800/50"
            >
              <Play className="w-3 h-3 group-hover:fill-current transition-colors" />
              Try with Demo Data
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Uploader;