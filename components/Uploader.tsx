import React, { useState } from 'react';
import { Upload, Play, Terminal, Key, FileJson, Copy, Check } from 'lucide-react';
import { UsageReport } from '../types';
import { COLLECTOR_SCRIPT_TEMPLATE } from '../constants';

interface UploaderProps {
  onDataLoaded: (data: UsageReport) => void;
  onLoadDemo: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ onDataLoaded, onLoadDemo }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'local' | 'api'>('local');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.usage || !json.provider) {
        throw new Error("Invalid format: Missing 'usage' or 'provider' fields.");
      }
      onDataLoaded(json as UsageReport);
    } catch (err) {
      setError("Failed to parse JSON file. Please ensure it matches the Usage Report spec.");
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
    // In a real app, we would fetch data here. 
    // For this demo, we'll simulate an error or show a message that API is pro feature.
    setError("Direct API connection is a Pro feature. Please use the Local Agent script for now.");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 max-w-4xl mx-auto">
      <div className="w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            LLM Usage Analyzer
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Connect your local development data or API history to see if you're overpaying for your AI subscriptions.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-900/50 p-1 rounded-xl inline-flex border border-slate-800 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('local')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'local' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-4 h-4" />
              Claude Local Data
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'api' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Key className="w-4 h-4" />
              OpenAI API
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload' 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <FileJson className="w-4 h-4" />
              Manual Upload
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          
          {/* TAB: LOCAL AGENT */}
          {activeTab === 'local' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 mt-1">
                  <Terminal className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-white">Extract Local Claude Usage</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Browser apps cannot access your file system directly. Run this secure Node.js script locally to scan your <code>~/.claude</code> folder and generate a privacy-friendly usage report.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden group">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800">
                  <span className="text-xs text-slate-500 font-mono">scan_usage.js</span>
                  <button 
                    onClick={copyScript}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied!' : 'Copy Script'}
                  </button>
                </div>
                <div className="relative">
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-slate-300 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {COLLECTOR_SCRIPT_TEMPLATE}
                  </pre>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/80 pointer-events-none"></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-indigo-400 font-bold mb-1">Step 1</div>
                  <div className="text-xs text-slate-400">Save the code above as <code>scan.js</code></div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-indigo-400 font-bold mb-1">Step 2</div>
                  <div className="text-xs text-slate-400">Run <code>node scan.js</code> in terminal</div>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                  <div className="text-indigo-400 font-bold mb-1">Step 3</div>
                  <div className="text-xs text-slate-400">Upload <code>usage_report.json</code> below</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                 <button 
                   onClick={() => setActiveTab('upload')}
                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                 >
                   I have the file, let's upload
                 </button>
              </div>
            </div>
          )}

          {/* TAB: API */}
          {activeTab === 'api' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1">
                  <Key className="w-6 h-6" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-xl font-bold text-white">Connect OpenAI API</h3>
                  <p className="text-slate-400 text-sm">
                    Enter your read-only API key to fetch usage history directly from OpenAI.
                    We do not store your key.
                  </p>
                </div>
              </div>

              <form onSubmit={handleApiKeySubmit} className="space-y-4 max-w-lg mx-auto py-8">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">OpenAI API Key</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Note: Your browser may block this request due to CORS. If so, use the Local Agent script.
                  </p>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
                >
                  Connect & Fetch Usage
                </button>
              </form>
            </div>
          )}

          {/* TAB: UPLOAD */}
          {activeTab === 'upload' && (
             <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
               <div 
                className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center
                  ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-950/50 hover:bg-slate-950'}
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
                
                <div className="p-4 bg-slate-800 rounded-full border border-slate-700 shadow-xl mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">Drag & drop <code>usage_report.json</code></p>
                  <p className="text-sm text-slate-400 mt-2">or <label htmlFor="file-upload" className="text-blue-400 hover:text-blue-300 cursor-pointer underline hover:no-underline font-medium">browse files</label></p>
                </div>
              </div>
            </div>
          )}

          {/* GLOBAL ERROR & DEMO */}
          {error && (
            <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4 w-full max-w-md">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-slate-600 text-xs uppercase tracking-wider font-semibold">No data yet?</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>
          
          <button 
            onClick={onLoadDemo}
            className="flex items-center gap-2 px-6 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all text-sm border border-transparent hover:border-slate-700"
          >
            <Play className="w-4 h-4" />
            Load Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Uploader;