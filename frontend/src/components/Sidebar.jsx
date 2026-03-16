import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Database, ActivitySquare, ShieldAlert, ArrowLeft, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
      isActive 
        ? 'bg-green-50 text-green-700' 
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Admin Panel</h2>
        <p className="text-xs text-slate-500 mt-1">Machine Unlearning</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/admin/dataset" className={linkClass}>
          <Database size={20} />
          <span>Dataset</span>
        </NavLink>
        <NavLink to="/admin/analyze" className={linkClass}>
          <ActivitySquare size={20} />
          <span>Analyze Dataset</span>
        </NavLink>
        <NavLink to="/admin/unlearn" className={linkClass}>
          <ShieldAlert size={20} />
          <span>Machine Unlearning</span>
        </NavLink>
        <NavLink to="/admin/feedback" className={linkClass}>
          <MessageSquare size={20} />
          <span>Feedback</span>
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <NavLink to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} />
          Back to User Site
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
