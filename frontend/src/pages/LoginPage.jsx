import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await api.post('/login', { username, password });
      
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        // Optional: Save username
        localStorage.setItem('username', username);
        
        if (res.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/profile');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Login</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 transition"
          >
            Login
          </button>
          <div className="text-center text-sm text-slate-500 mt-4">
            Don't have an account? <Link to="/register" className="text-green-600 hover:underline">Register</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
