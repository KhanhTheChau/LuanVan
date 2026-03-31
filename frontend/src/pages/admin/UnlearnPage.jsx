import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import UnlearnControl from '../../components/unlearn/UnlearnControl';
import UnlearnLogs from '../../components/unlearn/UnlearnLogs';
import UnlearnComparison from '../../components/unlearn/UnlearnComparison';
import { LayoutDashboard, FileText, BarChart3, Loader2 } from 'lucide-react';

const UnlearnPage = () => {
  const [activeTab, setActiveTab] = useState('unlearn');
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('IDLE');
  const [jobId, setJobId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const initData = useCallback(async () => {
    try {
      console.log("[FRONTEND] Fetching research statistics and comparison data...");
      
      const statsPromise = api.get('/unlearn/stats');
      const compPromise = api.get('/unlearn/comparison');

      const results = await Promise.allSettled([statsPromise, compPromise]);
      const [statsResult, compResult] = results;

      // 1. Handle Comparison Data (High Priority)
      if (compResult.status === 'fulfilled') {
        setComparison(compResult.value.data);
        console.log("[FRONTEND] Comparison data received:", compResult.value.data);
      } else {
        console.error("[FRONTEND] Comparison API failed:", compResult.reason);
      }

      // 2. Handle Stats Data
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value.data);
      } else {
        console.warn("[FRONTEND] Stats API failed (likely 401), skipping stats update.");
      }

    } catch (err) {
      console.error("[FRONTEND] Unexpected error during initial research data fetch", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initData();
  }, [initData]);

  // Polling for logs and status
  useEffect(() => {
    let interval;
    if (jobId && (status === 'running' || status === 'pending')) {
      interval = setInterval(async () => {
        try {
          const [statusRes, logsRes] = await Promise.all([
            api.get(`/unlearn/status/${jobId}`),
            api.get(`/unlearn/logs/${jobId}`)
          ]);
          
          setStatus(statusRes.data.status);
          setLogs(logsRes.data);

          if (statusRes.data.status === 'completed') {
            clearInterval(interval);
            const compRes = await api.get('/unlearn/comparison');
            setComparison(compRes.data);
          } else if (statusRes.data.status === 'failed') {
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error", err);
          clearInterval(interval);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [jobId, status]);

  const startUnlearning = async () => {
    try {
      setStatus('pending');
      setLogs([{ timestamp: new Date().toLocaleTimeString(), message: "Initiating research task...", level: "info" }]);
      const response = await api.post('/unlearn/start');
      setJobId(response.data.job_id);
      setActiveTab('logs'); // Switch to logs tab automatically
    } catch (err) {
      alert("Failed to start research task.");
      setStatus('failed');
    }
  };

  const tabs = [
    { id: 'unlearn', label: 'Unlearning Control', icon: <LayoutDashboard size={18} /> },
    { id: 'logs', label: 'Execution Logs', icon: <FileText size={18} /> },
    { id: 'comparison', label: 'Model Comparison', icon: <BarChart3 size={18} /> }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Loader2 className="animate-spin text-blue-600" size={48} />
        <p className="text-slate-500 font-medium">Loading research environment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Machine Unlearning</h1>
          <p className="text-slate-500 font-medium">Research Dashboard & Comparative Analysis</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'logs' && (status === 'running' || status === 'pending') && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'unlearn' && (
          <UnlearnControl 
            stats={stats} 
            status={status} 
            onStart={startUnlearning} 
            jobId={jobId} 
          />
        )}
        
        {activeTab === 'logs' && (
          <UnlearnLogs logs={logs} />
        )}
        
        {activeTab === 'comparison' && (
          <UnlearnComparison comparison={comparison} />
        )}
      </div>
    </div>
  );
};

export default UnlearnPage;
