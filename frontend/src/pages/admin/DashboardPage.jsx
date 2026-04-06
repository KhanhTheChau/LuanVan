import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers, Image as ImageIcon, ShieldAlert, Cpu, Loader2, AlertCircle, TrendingUp, Target, BarChart3, PieChart as PieChartIcon, Database, LayoutDashboard } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3 border border-slate-100">
    <div className="flex items-center justify-between">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        {icon}
      </div>
      {subtitle && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subtitle}</span>}
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  </div>
);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, systemRes] = await Promise.all([
          api.get('/dataset/stats'),
          api.get('/system/stats')
        ]);
        setStats(statsRes.data);
        setSystemStats(systemRes.data);
        setError(null);
      } catch (err) {
        console.error("Dashboard data fetch failed:", err);
        setError("Failed to load dashboard data. Please check if backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse" />
          <Loader2 className="animate-spin text-blue-600 absolute inset-0 m-auto" size={32} />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-xs mt-6">Initializing Analytics Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-12 rounded-3xl border-2 border-red-50 text-center max-w-2xl mx-auto shadow-2xl mt-12">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-red-500" size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-800 mb-2">Sync Error</h3>
        <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200"
        >
          Re-initialize Data Sync
        </button>
      </div>
    );
  }

  // Deep Insights Logic
  const rawLabelCounts = stats?.label_counts || {};
  const cleanLabelCounts = Object.fromEntries(
    Object.entries(rawLabelCounts).filter(
      ([key]) => key && key.toLowerCase() !== "unknown"
    )
  );

  const cleanTotalImages = Object.values(cleanLabelCounts).reduce((a, b) => a + b, 0);
  const sortedLabels = Object.entries(cleanLabelCounts).sort((a, b) => b[1] - a[1]);
  const totalClasses = sortedLabels.length;
  const largestClass = sortedLabels[0] || ["None", 0];
  const smallestClass = sortedLabels[sortedLabels.length - 1] || ["None", 0];
  
  const imbalanceRatio = smallestClass[1] > 0 ? (largestClass[1] / smallestClass[1]).toFixed(1) : "N/A";
  const largestClassPercent = cleanTotalImages > 0 ? ((largestClass[1] / cleanTotalImages) * 100).toFixed(1) : 0;
  
  // Readiness Rating
  const isImbalanced = imbalanceRatio > 3;
  const isRichData = cleanTotalImages > 1000;
  const readiness = isImbalanced ? "Needs Attention" : isRichData ? "Training Ready" : "Sufficient";
  const readinessColor = isImbalanced ? "text-orange-500" : "text-emerald-500";

  // Chart Data
  const splitData = stats ? Object.entries(stats.split_counts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  const fullLabelsData = sortedLabels.map(([name, count]) => ({ name, count }));

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10 pb-12 animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-50">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
             <LayoutDashboard className="text-blue-600" size={28} /> System Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">Dataset Analytics & Model Quality Monitoring</p>
        </div>
        <div className="text-right hidden md:block">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Last Engine Sync</div>
          <div className="px-4 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-800 border border-slate-100">
             {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      {/* Row 1: Key Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <StatCard title="Total Volume" value={cleanTotalImages.toLocaleString()} icon={<ImageIcon size={22} />} color="blue" subtitle="Clean Dataset" />
        <StatCard title="Target Classes" value={totalClasses} icon={<Target size={22} />} color="indigo" subtitle="Disease Nodes" />
        <StatCard title="Train Size" value={stats?.split_counts.train || 0} icon={<Layers size={22} />} color="emerald" subtitle="70-80%" />
        <StatCard title="Val Size" value={stats?.split_counts.val || 0} icon={<Database size={22} />} color="purple" subtitle="Dev Set" />
        <StatCard title="Test Size" value={stats?.split_counts.test || 0} icon={<Cpu size={22} />} color="fuchsia" subtitle="Eval Set" />
        <StatCard title="Noisy Nodes" value={stats?.noisy_count || 0} icon={<AlertCircle size={22} />} color="rose" subtitle="Filtered" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="User Network" value={systemStats?.total_users || 0} icon={<Cpu size={22} />} color="slate" subtitle="Active" />
        <StatCard title="Predictions" value={systemStats?.total_predictions || 0} icon={<TrendingUp size={22} />} color="sky" subtitle="Model Hit" />
        <StatCard title="Feedback" value={systemStats?.total_feedback || 0} icon={<Loader2 size={22} />} color="pink" subtitle="Correction" />
      </div>

      {/* Row 2: Deep Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Dataset Splits */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm p-8 border border-slate-50">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
             <PieChartIcon size={20} className="text-blue-600" />
             <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Split Distribution</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={splitData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {splitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {splitData.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-[10px] font-black text-slate-400 uppercase">{s.name}</div>
                <div className="text-sm font-black text-slate-700">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DATA QUALITY INSIGHTS (NEW) */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-8 border border-slate-50">
          <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
            <div className="flex items-center gap-3">
               <TrendingUp size={20} className="text-emerald-600" />
               <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Quality Insights</h3>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 ${readinessColor} border border-slate-100`}>
               Ready Status: {readiness}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Imbalance Profile</div>
                <div className="flex items-end gap-2">
                  <span className={`text-5xl font-black ${imbalanceRatio > 5 ? 'text-rose-500' : imbalanceRatio > 3 ? 'text-orange-500' : 'text-emerald-500'}`}>
                    {imbalanceRatio}x
                  </span>
                  <span className="text-xs font-bold text-slate-400 mb-2 uppercase italic tracking-tighter">ratio (max/min)</span>
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Largest Class</span>
                  <span className="text-sm font-black text-slate-800">{largestClass[0]}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Smallest Class</span>
                  <span className="text-sm font-black text-slate-800">{smallestClass[0]}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full mt-2 overflow-hidden">
                   <div className="h-full bg-blue-500" style={{width: `${largestClassPercent}%`}} />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                 <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Dominance Metrics</div>
                 <div className="flex items-end gap-2">
                  <span className="text-5xl font-black text-slate-800">{largestClassPercent}%</span>
                  <span className="text-xs font-bold text-slate-400 mb-2 uppercase italic tracking-tighter leading-tight">held by<br/>{largestClass[0]}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <div className="text-[9px] font-black text-indigo-400 uppercase mb-1">Clean Factor</div>
                    <div className="text-xl font-black text-indigo-700">{((1 - (stats?.noisy_count / stats?.total_images)) * 100).toFixed(0)}%</div>
                 </div>
                 <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="text-[9px] font-black text-emerald-400 uppercase mb-1">Class Yield</div>
                    <div className="text-xl font-black text-emerald-700">{(stats?.total_images / totalClasses).toFixed(0)} <span className="text-[10px]">img/avg</span></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Full Distribution */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-50 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-indigo-600" />
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Full Disease Distribution</h3>
          </div>
          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase whitespace-nowrap">
            {totalClasses} Classes Monitored
          </span>
        </div>
        <div className="p-8">
          <div className={`${totalClasses > 15 ? 'h-[800px]' : 'h-128'} w-full overflow-y-auto pr-4 custom-scrollbar`}>
            <ResponsiveContainer width="100%" height={totalClasses * 40}>
              <BarChart
                data={fullLabelsData}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24}>
                   {fullLabelsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index > totalClasses - 3 ? '#94a3b8' : '#818cf8'} />
                   ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

