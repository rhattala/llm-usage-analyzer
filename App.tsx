import React, { useState } from 'react';
import Uploader from './components/Uploader';
import AnalysisDashboard from './components/AnalysisDashboard';
import { UsageReport } from './types';
import { MOCK_DATA } from './constants';

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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              L
            </div>
            <span className="font-bold text-lg tracking-tight text-white">LLM Usage Analyzer</span>
          </div>
          <div>
            <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      <main>
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
