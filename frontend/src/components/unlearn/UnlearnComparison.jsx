import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Clock, Target, CheckCircle } from 'lucide-react';

const UnlearnComparison = ({ comparison }) => {
  // 1. Simple data presence check
  if (!comparison || comparison.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400">
        <TrendingUp size={48} className="mb-4" />
        <p className="text-lg font-medium tracking-tight text-slate-600">No comparison data available.</p>
        <p className="text-sm">Please import evaluation results to see comparative analysis.</p>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];
  
  // 2. Identify priority models for charts/cards
  const researchTargets = ['Improved', 'Retrain', 'Baseline'];
  const primaryModels = comparison.filter(m => researchTargets.includes(m.name));
  
  // Use primary models for charts if they exist, otherwise use first 5 models
  const chartData = primaryModels.length >= 2 ? primaryModels : comparison.slice(0, 5);

  const dataAcc = chartData.map(m => ({ name: m.name, accuracy: m.accuracy * 100 }));
  const dataF1 = chartData.map(m => ({ name: m.name, f1: m.f1 }));

  // 3. Safe summary calculations
  const improvedMetrics = comparison.find(m => m.name === 'Improved');
  const baselineMetrics = comparison.find(m => m.name === 'Retrain');
  
  const hasComparison = improvedMetrics && baselineMetrics;
  const accImp = hasComparison ? ((improvedMetrics.accuracy - baselineMetrics.accuracy) * 100).toFixed(2) : "0.00";
  const timeSaved = hasComparison ? (baselineMetrics.training_time - improvedMetrics.training_time).toFixed(1) : "0.0";

  // 4. Calculate best values for each metric for highlighting
  const maxAccuracy = Math.max(...comparison.map(m => m.accuracy));
  const maxF1 = Math.max(...comparison.map(m => m.f1));
  const maxPrecision = Math.max(...comparison.map(m => m.precision));
  const maxRecall = Math.max(...comparison.map(m => m.recall || 0));
  const minTime = Math.min(...comparison.map(m => m.training_time));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Metrics Cards - Priority Research Targets or Top 3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(primaryModels.length > 0 ? primaryModels : comparison.slice(0, 3)).map((model, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border-2 shadow-sm transition-all hover:shadow-md border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-slate-800 truncate" title={model.name}>{model.name}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Accuracy</span>
                <span className="text-xl font-black text-slate-800">{(model.accuracy * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">F1-Score</span>
                <span className="text-lg font-bold text-slate-700">{model.f1}</span>
              </div>
              <div className="flex justify-between items-end border-b border-slate-50 pb-2">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Training Time</span>
                <span className="text-sm font-medium text-slate-600">{model.training_time}s</span>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-slate-400 italic font-medium line-clamp-2">{model.description}</p>
          </div>
        ))}
      </div>

      {/* Charts - Accuracy & F1 Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-6 uppercase flex items-center gap-2">
            <Target size={16} className="text-indigo-500" /> Accuracy Comparison (%)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataAcc}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={0} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} barSize={35}>
                  {dataAcc.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 mb-6 uppercase flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-500" /> F1-Score (Macro Avg)
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataF1}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} interval={0} />
                <YAxis hide domain={[0, 1]} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="f1" radius={[6, 6, 0, 0]} barSize={35}>
                  {dataF1.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Core Methodology Comparison - TOP 3 MODELS ONLY */}
      {primaryModels.length > 0 && (
        <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg overflow-hidden animate-in zoom-in-95 duration-700">
          <div className="px-8 py-5 border-b border-indigo-50 flex justify-between items-center bg-indigo-50/30">
            <div>
              <h4 className="text-lg font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={20} className="text-indigo-600" /> Core Methodology Comparison
              </h4>
              <p className="text-xs text-indigo-400 font-medium mt-1">Comparing the three primary Selective Forgetting approaches.</p>
            </div>
            <span className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black uppercase shadow-sm">Research Baseline</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-50/10 border-b border-indigo-50">
                  <th className="px-8 py-5 text-xs font-black text-indigo-800 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">Accuracy (%)</th>
                  <th className="px-6 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">F1 Score</th>
                  <th className="px-6 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">Precision</th>
                  <th className="px-6 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">Recall</th>
                  <th className="px-6 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">Memory (MB)</th>
                  <th className="px-8 py-5 text-xs font-black text-indigo-800 uppercase text-center tracking-widest">Time (s)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50/50">
                {primaryModels.map((model, idx) => {
                  const isBestAcc = model.accuracy === Math.max(...primaryModels.map(m => m.accuracy));
                  const isBestF1 = model.f1 === Math.max(...primaryModels.map(m => m.f1));
                  const isBestPrec = model.precision === Math.max(...primaryModels.map(m => m.precision));
                  const isBestRec = (model.recall || 0) === Math.max(...primaryModels.map(m => (m.recall || 0)));
                  const isBestTime = model.training_time === Math.min(...primaryModels.map(m => m.training_time));
                  
                  return (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                           <div className={`w-3 h-3 rounded-full shadow-sm animate-pulse ${model.name === 'Improved' ? 'bg-indigo-600' : model.name === 'Retrain' ? 'bg-sky-400' : 'bg-slate-400'}`}></div>
                           <span className="text-sm font-black text-slate-800 tracking-tight">{model.name}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-6 text-center text-sm ${isBestAcc ? 'font-black text-indigo-600 scale-105' : 'text-slate-600'}`}>
                        {(model.accuracy * 100).toFixed(2)}%
                      </td>
                      <td className={`px-6 py-6 text-center text-sm ${isBestF1 ? 'font-black text-indigo-600 scale-105' : 'text-slate-600'}`}>
                        {model.f1.toFixed(3)}
                      </td>
                      <td className={`px-6 py-6 text-center text-sm ${isBestPrec ? 'font-black text-indigo-600 scale-105' : 'text-slate-600'}`}>
                        {model.precision.toFixed(3)}
                      </td>
                      <td className={`px-6 py-6 text-center text-sm ${isBestRec ? 'font-black text-indigo-600 scale-105' : 'text-slate-600'}`}>
                        {(model.recall || 0).toFixed(3)}
                      </td>
                      <td className="px-6 py-6 text-center text-sm font-medium text-slate-500 italic">
                        {model.memory_mb ? model.memory_mb.toFixed(1) : 'N/A'}
                      </td>
                      <td className={`px-8 py-6 text-center text-sm ${isBestTime ? 'font-black text-indigo-600' : 'text-slate-600'}`}>
                        <div className={`inline-block px-4 py-1.5 rounded-full font-black font-mono transition-transform group-hover:scale-110 ${isBestTime ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                          {model.training_time.toFixed(1)}s
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Comparison Table - All Records */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Full Evaluation Metrics</h4>
          <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-black uppercase">{comparison.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Model Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Acc (%)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">F1</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Precision</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Recall</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Memory (MB)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Time (s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparison.map((model, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${model.name === 'Improved' ? 'bg-indigo-500 scale-125' : model.name === 'Retrain' ? 'bg-blue-400' : 'bg-slate-300'}`}></span>
                       <span className="text-sm text-slate-700">{model.name}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-center text-sm ${model.accuracy === maxAccuracy ? 'font-bold text-green-600' : 'text-slate-800'}`}>
                    {(model.accuracy * 100).toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 text-center text-sm ${model.f1 === maxF1 ? 'font-bold text-green-600' : 'text-slate-600'}`}>
                    {model.f1}
                  </td>
                  <td className={`px-6 py-4 text-center text-sm ${model.precision === maxPrecision ? 'font-bold text-green-600' : 'text-slate-600'}`}>
                    {model.precision}
                  </td>
                  <td className={`px-6 py-4 text-center text-sm ${model.recall === maxRecall ? 'font-bold text-green-600' : 'text-slate-600'}`}>
                    {model.recall || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-600">
                    {model.memory_mb || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 text-center text-sm ${model.training_time === minTime ? 'font-bold text-green-600' : 'text-slate-600'}`}>
                    <span className={`px-3 py-1 rounded-full font-mono ${model.training_time === minTime ? 'bg-green-50' : 'bg-slate-100'}`}>
                      {model.training_time}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Highlight */}
      {hasComparison ? (
        <div className="bg-indigo-900 rounded-3xl p-10 text-white flex flex-col md:flex-row items-center justify-around gap-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-36 -mt-36"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full -ml-28 -mb-28"></div>
          
          <div className="z-10 text-center md:text-left flex-1">
            <h3 className="text-3xl font-black mb-2 tracking-tight">Selective Forgetting Summary</h3>
            <p className="text-indigo-200 text-sm max-w-sm">Comparing the optimized selective forgetting model against the standard retraining baseline.</p>
          </div>
          
          <div className="z-10 flex gap-6">
            <div className="bg-white/10 backdrop-blur-xl px-8 py-6 rounded-2xl text-center border border-white/20 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-indigo-300 text-[10px] uppercase font-black mb-2 tracking-widest">
                <CheckCircle size={12} /> Accuracy Boost
              </div>
              <div className="text-4xl font-black text-emerald-400">+{accImp}%</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl px-8 py-6 rounded-2xl text-center border border-white/20 shadow-inner">
              <div className="flex items-center justify-center gap-2 text-indigo-300 text-[10px] uppercase font-black mb-2 tracking-widest">
                <Clock size={12} /> Time Efficiency
              </div>
              <div className="text-4xl font-black text-sky-300">{timeSaved}s</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-2xl p-6 text-white text-center text-sm font-medium italic">
          Load both "Improved" and "Retrain" models to see improvement summaries.
        </div>
      )}
    </div>
  );
};

export default UnlearnComparison;
