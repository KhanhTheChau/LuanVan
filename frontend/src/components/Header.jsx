import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    setIsAdminLoggedIn(!!token && role === 'admin');
    setIsUserLoggedIn(!!token && role === 'user');
  }, []);
  const navLinkClass = ({ isActive }) =>
    `font-medium transition-colors ${
      isActive ? 'text-green-600 border-b-2 border-green-600 pb-1' : 'text-slate-600 hover:text-green-500'
    }`;

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              {/* Optional: <img src="/logo.png" alt="Logo" className="w-8 h-8"/> */}
              <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center text-white font-bold text-xl">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 leading-tight">AI Plant Disease Detection</h1>
                <p className="text-xs text-slate-500">AI-powered Crop Health Analysis</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex gap-6 items-center">
            <NavLink to="/" className={navLinkClass} end>Home</NavLink>
            <NavLink to="/predict" className={navLinkClass}>Predict</NavLink>
            <NavLink to="/guide" className={navLinkClass}>Guide</NavLink>
            <NavLink to="/pol" className={navLinkClass}>Policy</NavLink>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>

            {isAdminLoggedIn && (
              <button 
                onClick={() => navigate('/admin/dashboard')}
                className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition ml-2 shadow-sm"
              >
                Admin Panel
              </button>
            )}

            {!isUserLoggedIn ? (
              <div className="flex gap-2 ml-2">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-sm"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm"
                >
                  Register
                </button>
              </div>
            ) : (
              <div className="flex gap-2 ml-2">
                <button 
                  onClick={() => navigate('/profile')}
                  className="px-4 py-2 bg-slate-100 text-green-700 text-sm font-medium rounded-lg border border-green-200 hover:bg-slate-200 transition shadow-sm"
                >
                  Profile
                </button>
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    localStorage.removeItem('username');
                    setIsUserLoggedIn(false);
                    navigate('/');
                  }}
                  className="px-4 py-2 bg-white text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-50 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
