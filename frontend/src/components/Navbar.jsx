import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  const linkClass = ({ isActive }) => 
    `px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
      isActive 
        ? 'border-green-600 text-green-700' 
        : 'border-transparent text-slate-600 hover:text-green-600 hover:border-green-200'
    }`;

  return (
    <nav className="bg-white sticky top-0 z-50 shadow-sm border-b">
      <div className="container mx-auto px-4">
        <ul className="flex space-x-2">
          <li>
            <NavLink to="/" end className={linkClass}>Inference</NavLink>
          </li>
          <li>
            <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          </li>
          <li>
            <span className="px-4 py-3 font-medium text-sm text-slate-400 cursor-not-allowed">User Guide</span>
          </li>
          <li>
            <span className="px-4 py-3 font-medium text-sm text-slate-400 cursor-not-allowed">Dataset</span>
          </li>
          <li>
            <span className="px-4 py-3 font-medium text-sm text-slate-400 cursor-not-allowed">Policy</span>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
