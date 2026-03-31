import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

const UnlearnLogs = ({ logs }) => {
  const logEndRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLevelStyle = (level) => {
    switch (level) {
      case 'success': return 'text-green-500 font-bold';
      case 'error': return 'text-red-500 font-bold';
      case 'warning': return 'text-amber-500 font-bold';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-[600px]">
      <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2 text-slate-300">
          <Terminal size={18} />
          <span className="text-xs font-mono uppercase tracking-widest font-bold">Execution Logs</span>
        </div>
        <div className="flex gap-1.5 font-mono">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 scrollbar-hide">
        {logs && logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="flex gap-3 leading-relaxed border-b border-slate-800/50 pb-1">
              <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
              <span className={getLevelStyle(log.level)}>{log.message}</span>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <Terminal size={48} strokeWidth={1} />
            <p>No active session logs found. Start an evaluation to see output.</p>
          </div>
        )}
        <div ref={logEndRef} />
      </div>
      
      <div className="bg-slate-800/50 px-4 py-2 text-[10px] font-mono text-slate-500 flex justify-between uppercase">
        <span>Channel: unlearn_research_task</span>
        <span>Ready: true</span>
      </div>
    </div>
  );
};

export default UnlearnLogs;
