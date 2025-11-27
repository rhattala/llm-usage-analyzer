import React, { useState } from 'react';
import Uploader from './components/Uploader';
import AnalysisDashboard from './components/AnalysisDashboard';
import { UsageReport } from './types';
import { MOCK_DATA } from './constants';
import { Activity } from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<UsageReport | null>(null);

  const handleDataLoaded = (uploadedData: UsageReport) => {
    setData(uploadedData);
  };

  const handleLoadDemo = () => {
    setData(MOCK_DATA);
  };

  const handleReset = () => {
    setData(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0C15] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[60%] h-[60%] bg-slate-900/0 rounded-full blur-[100px]"></div>
      </div>

      <nav className="border-b border-white/5 bg-slate-950/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white/90">Usage<span className="text-indigo-400">Analyzer</span></span>
          </div>
          <div className="flex items-center gap-4">
             {data && (
               <button onClick={handleReset} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                 New Analysis
               </button>
             )}
            <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5">GitHub</a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {!data ? (
          <Uploader onDataLoaded={handleDataLoaded} onLoadDemo={handleLoadDemo} />
        ) : (
          <AnalysisDashboard data={data} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default App;