import React, { useState } from 'react';
import { Upload, FileJson, Play } from 'lucide-react';
import { UsageReport } from '../types';

interface UploaderProps {
  onDataLoaded: (data: UsageReport) => void;
  onLoadDemo: () => void;
}

const Uploader: React.FC<UploaderProps> = ({ onDataLoaded, onLoadDemo }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Basic validation
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

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="w-full max-w-2xl text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            LLM Usage Analyzer
          </h1>
          <p className="text-slate-400 text-lg">
            Stop overpaying for AI subscriptions. specificy your usage and find the right plan.
          </p>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-10 transition-all duration-200 ease-in-out
            ${dragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50'}
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
          
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-slate-800 rounded-full border border-slate-700 shadow-xl">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-white">Drag & drop your usage JSON</p>
              <p className="text-sm text-slate-400 mt-1">or <label htmlFor="file-upload" className="text-blue-400 hover:text-blue-300 cursor-pointer underline">browse files</label></p>
            </div>
          </div>
          
          {error && (
            <div className="absolute bottom-4 left-0 right-0 mx-auto text-red-400 text-sm bg-red-900/20 py-1 px-3 rounded-full w-fit">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="h-px bg-slate-800 flex-1"></div>
          <span className="text-slate-600 text-sm uppercase tracking-wider">or try it out</span>
          <div className="h-px bg-slate-800 flex-1"></div>
        </div>

        <button 
          onClick={onLoadDemo}
          className="flex items-center justify-center gap-2 w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors group"
        >
          <Play className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          Load Demo Data (Simulated Claude Usage)
        </button>

        <p className="text-xs text-slate-600 mt-8 max-w-lg mx-auto">
          Compatible with <code>llm-usage-cli</code> export format. 
          Your data is processed locally in your browser.
        </p>
      </div>
    </div>
  );
};

export default Uploader;
