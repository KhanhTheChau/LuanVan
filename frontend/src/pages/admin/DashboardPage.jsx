import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers, Image as ImageIcon, ShieldAlert, Cpu, Loader2, AlertCircle } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl shadow-md flex items-center gap-4 border border-slate-50">
    <div className={`p-4 rounded-xl bg-${color}-50 text-${color}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, systemRes, imagesRes] = await Promise.all([
          api.get('/dataset/stats'),
          api.get('/system/stats'),
          api.get('/images?limit=15')
        ]);
        setStats(statsRes.data);
        setSystemStats(systemRes.data);
        setImages(imagesRes.data.images);
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
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-500 font-medium tracking-wide">Loading system statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100 text-center max-w-2xl mx-auto mt-12">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h3 className="text-lg font-bold text-red-800 mb-2">System Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Transform data for charts
  const splitData = stats ? Object.entries(stats.split_counts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })) : [];

  const topLabelsData = stats ? Object.entries(stats.label_counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) : [];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Dashboard</h1>
          <p className="text-slate-500 text-sm">Real-time overview of the PlantDoc dataset and system activity.</p>
        </div>
        <div className="text-xs text-slate-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Dataset Statistics */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider -mb-2">Dataset Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Images" value={stats?.total_images.toLocaleString()} icon={<ImageIcon size={24} />} color="blue" />
        <StatCard title="Train Set" value={stats?.split_counts.train || 0} icon={<Layers size={24} />} color="green" />
        <StatCard title="Validation" value={stats?.split_counts.val || 0} icon={<Cpu size={24} />} color="purple" />
        <StatCard title="Test Set" value={stats?.split_counts.test || 0} icon={<Layers size={24} />} color="orange" />
        <StatCard title="Noisy Data" value={stats?.noisy_count || 0} icon={<ShieldAlert size={24} />} color="red" />
      </div>

      {/* System Metrics */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider -mb-2 mt-2">Environment & Activity</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={systemStats?.total_users || 0} icon={<Cpu size={24} />} color="slate" />
        <StatCard title="Predictions" value={systemStats?.total_predictions || 0} icon={<ImageIcon size={24} />} color="indigo" />
        <StatCard title="Feedbacks" value={systemStats?.total_feedback || 0} icon={<ShieldAlert size={24} />} color="pink" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart: Dataset Splits */}
        <div className="lg:col-span-1 rounded-2xl shadow-md p-4 bg-white border border-slate-50 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Dataset Splits</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={splitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {splitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Top 10 Classes */}
        <div className="lg:col-span-2 rounded-2xl shadow-md p-4 bg-white border border-slate-50 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Top 10 Disease Distribution</h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topLabelsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Image Preview Grid */}
      <div className="rounded-2xl shadow-md p-4 bg-white border border-slate-50">
        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Latest Dataset Preview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <img 
                src={`/api/dataset/image/${img.id}`}
                alt={img.filename}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                <p className="text-white text-[10px] font-bold truncate leading-tight mb-1">{img.label}</p>
                <div className={`w-fit px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${img.is_noisy ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                  {img.is_noisy ? 'Noisy' : 'Clean'}
                </div>
              </div>
            </div>
          ))}
        </div>
        {images.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            No images found in dataset.
          </div>
        )}
      </div>
    </div>
  );
};


export default DashboardPage;

