import React, { useState, useEffect, useCallback } from 'react';
import Uploader from './components/Uploader';
import AnalysisDashboard from './components/AnalysisDashboard';
import HistoryView from './components/HistoryView';
import { UsageReport, StoredReport } from './types';
import { MOCK_DATA } from './constants';
import { Activity, History, ChevronDown, Trash2, X, TrendingUp } from 'lucide-react';
import { storageService } from './services/storageService';

type ViewMode = 'uploader' | 'dashboard' | 'trends';

const LOCAL_SERVER_URL = 'http://localhost:3456';

const App: React.FC = () => {
  const [data, setData] = useState<UsageReport | null>(null);
  const [savedReports, setSavedReports] = useState<StoredReport[]>([]);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('uploader');
  const [isLiveData, setIsLiveData] = useState(false);
  const [liveServerConnected, setLiveServerConnected] = useState(false);

  // Initialize storage and restore session state on mount
  useEffect(() => {
    storageService.init();
    const reports = storageService.getReports();
    setSavedReports(reports);

    // Restore session state (survives browser refresh)
    const savedViewMode = sessionStorage.getItem('viewMode') as ViewMode;
    const savedReportId = sessionStorage.getItem('currentReportId');

    if (savedViewMode && savedReportId) {
      const report = reports.find(r => r.id === savedReportId);
      if (report) {
        setData(report.report);
        setCurrentReportId(savedReportId);
        setViewMode(savedViewMode === 'trends' ? 'trends' : 'dashboard');
      }
    } else if (savedViewMode === 'trends') {
      setViewMode('trends');
    }
  }, []);

  // Persist session state on changes
  useEffect(() => {
    sessionStorage.setItem('viewMode', viewMode);
    if (currentReportId) {
      sessionStorage.setItem('currentReportId', currentReportId);
    } else {
      sessionStorage.removeItem('currentReportId');
    }
  }, [viewMode, currentReportId]);

  // Check server connection when in live mode
  useEffect(() => {
    if (!isLiveData) {
      setLiveServerConnected(false);
      return;
    }

    const checkConnection = async () => {
      try {
        const res = await fetch(`${LOCAL_SERVER_URL}/api/health`, {
          signal: AbortSignal.timeout(2000)
        });
        setLiveServerConnected(res.ok);
      } catch {
        setLiveServerConnected(false);
      }
    };

    // Check immediately and then every 5 seconds
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isLiveData]);

  // Refresh data from live server
  const handleLiveRefresh = useCallback(async () => {
    if (!isLiveData) return;
    try {
      const res = await fetch(`${LOCAL_SERVER_URL}/api/usage`);
      if (res.ok) {
        const newData = await res.json() as UsageReport;
        setData(newData);
        setLiveServerConnected(true);
      }
    } catch {
      setLiveServerConnected(false);
    }
  }, [isLiveData]);

  const handleDataLoaded = useCallback((uploadedData: UsageReport, fromLiveServer: boolean = false) => {
    setData(uploadedData);
    setViewMode('dashboard');
    setIsLiveData(fromLiveServer);
    if (fromLiveServer) {
      setLiveServerConnected(true);
    }

    // Check if this is a new report (not from history)
    if (!currentReportId) {
      // Auto-save new uploads
      const duplicate = storageService.findDuplicateReport(uploadedData);
      if (!duplicate) {
        const saved = storageService.saveReport(uploadedData);
        setSavedReports(storageService.getReports());
        setCurrentReportId(saved.id);
      } else {
        setCurrentReportId(duplicate.id);
      }
    }
  }, [currentReportId]);

  const handleLoadDemo = () => {
    setData(MOCK_DATA);
    setCurrentReportId(null); // Demo data is not saved
    setIsLiveData(false);
    setViewMode('dashboard');
  };

  const handleReset = () => {
    setData(null);
    setCurrentReportId(null);
    setIsLiveData(false);
    setViewMode('uploader');
    // Clear session to ensure clean state on refresh
    sessionStorage.removeItem('viewMode');
    sessionStorage.removeItem('currentReportId');
  };

  const handleViewTrends = () => {
    setViewMode('trends');
  };

  const handleBackFromTrends = () => {
    setViewMode(data ? 'dashboard' : 'uploader');
  };

  const handleLoadFromHistory = (stored: StoredReport) => {
    setData(stored.report);
    setCurrentReportId(stored.id);
    setIsLiveData(false);
    setShowHistory(false);
    setViewMode('dashboard');
  };

  const handleDeleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.deleteReport(id);
    setSavedReports(storageService.getReports());

    // If we deleted the current report, go back to uploader
    if (currentReportId === id) {
      setData(null);
      setCurrentReportId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            {/* Trends Button */}
            {savedReports.length >= 1 && viewMode !== 'trends' && (
              <button
                onClick={handleViewTrends}
                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Trends</span>
              </button>
            )}

            {/* History Dropdown */}
            {savedReports.length > 0 && viewMode !== 'trends' && (
              <div className="relative">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5"
                >
                  <History className="w-4 h-4" />
                  <span>History</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                </button>

                {showHistory && (
                  <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-400">Saved Reports ({savedReports.length})</span>
                        <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {savedReports.map((stored) => (
                          <button
                            key={stored.id}
                            onClick={() => handleLoadFromHistory(stored)}
                            className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between group ${
                              currentReportId === stored.id ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{stored.name}</div>
                              <div className="text-xs text-slate-500">{formatDate(stored.savedAt)}</div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteFromHistory(stored.id, e)}
                              className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {viewMode === 'dashboard' && (
              <button onClick={handleReset} className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
                New Analysis
              </button>
            )}
            <a href="https://github.com/rhattala/llm-usage-analyzer" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/5">GitHub</a>
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        {viewMode === 'uploader' && (
          <Uploader onDataLoaded={handleDataLoaded} onLoadDemo={handleLoadDemo} />
        )}
        {viewMode === 'dashboard' && data && (
          <AnalysisDashboard
            data={data}
            onReset={handleReset}
            isLiveData={isLiveData}
            liveServerConnected={liveServerConnected}
            onLiveRefresh={handleLiveRefresh}
          />
        )}
        {viewMode === 'trends' && (
          <HistoryView reports={savedReports} onBack={handleBackFromTrends} />
        )}
      </main>
    </div>
  );
};

export default App;