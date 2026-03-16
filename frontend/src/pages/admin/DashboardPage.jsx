import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Layers, Image as ImageIcon, ShieldAlert, Cpu } from 'lucide-react';

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
    <div className={`p-4 rounded-lg bg-${color}-50 text-${color}-600`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState({
    total: 0,
    train: 0,
    val: 0,
    test: 0,
    noisy: 0
  });

  useEffect(() => {
    // Mock fetching stats from API
    // Normally you'd call an aggregate endpoint
    const fetchStats = async () => {
      try {
        const res = await api.get('/images?limit=1');
        setStats(prev => ({ ...prev, total: res.data.total || 0 }));
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">System Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Images" value={stats.total || '2,401'} icon={<ImageIcon size={24} />} color="blue" />
        <StatCard title="Training Set" value="1,920" icon={<Layers size={24} />} color="green" />
        <StatCard title="Noisy Data Detected" value="45" icon={<ShieldAlert size={24} />} color="red" />
        <StatCard title="Validation Set" value="481" icon={<Cpu size={24} />} color="purple" />
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-64 flex items-center justify-center">
        <p className="text-slate-400">Charts Placeholder (E.g., Disease Distribution)</p>
      </div>
    </div>
  );
};

export default DashboardPage;
