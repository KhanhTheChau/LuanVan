import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const res = await api.post('/register', { username, password });
      if (res.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Create Account</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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
            className="w-full bg-slate-800 text-white font-medium py-2 rounded-lg hover:bg-slate-700 transition"
          >
            Register
          </button>
          <div className="text-center text-sm text-slate-500 mt-4">
            Already have an account? <Link to="/login" className="text-green-600 hover:underline">Log In</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
