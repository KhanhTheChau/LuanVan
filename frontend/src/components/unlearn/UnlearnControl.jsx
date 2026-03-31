import React from 'react';
import { Database, Trash2, Play, Activity } from 'lucide-react';

const UnlearnControl = ({ stats, status, onStart, jobId }) => {
  const isRunning = status === 'running' || status === 'pending';
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Database size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Total Dataset</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.total_images || 0} Images</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Trash2 size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Identified Noisy Samples</p>
            <h3 className="text-2xl font-bold text-slate-800">{stats?.noisy_images || 0} Samples</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <Activity size={48} className={`mx-auto mb-4 ${isRunning ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Machine Unlearning Control</h2>
        <p className="text-slate-600 max-w-md mx-auto mb-8">
          Execute research evaluation to compare Baseline, Standard Unlearning, and the Improved Attention-based Selective Forgetting model.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            disabled={isRunning}
            className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all transform hover:scale-105 active:scale-95 ${
              isRunning ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-200'
            }`}
          >
            <Play size={20} fill="currentColor" />
            {isRunning ? 'Execution in Progress...' : 'Start Research Evaluation'}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 uppercase font-semibold">Status:</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase ${
              status === 'completed' ? 'bg-green-100 text-green-700' :
              status === 'running' ? 'bg-blue-100 text-blue-700' :
              status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {status || 'IDLE'}
            </span>
          </div>

          {jobId && (
            <p className="text-xs text-slate-400 mt-2 font-mono">Job ID: {jobId}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnlearnControl;
