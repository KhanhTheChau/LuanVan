import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [profileRes, historyRes] = await Promise.all([
          api.get('/profile'),
          api.get('/history')
        ]);
        setProfile(profileRes.data);
        setHistory(historyRes.data.history);
      } catch (err) {
        console.error("Failed to load profile:", err);
        // Force logout if Unauthorized
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          localStorage.removeItem('username');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (localStorage.getItem('token')) {
       fetchUserData();
    } else {
       navigate('/login');
    }
  }, [navigate]);

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading profile data...</div>;
  }

  if (!profile) return null;

  const backendHost = 'http://localhost:5000';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Profile Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hello, {profile.username}!</h2>
          <p className="text-slate-500 mt-1">
            Account created on: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');
            navigate('/');
            window.location.reload();
          }}
          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition font-medium"
        >
          Logout
        </button>
      </div>

      {/* Prediction History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Your Prediction History</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No predictions found. Head over to the predictor to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-sm text-slate-500 uppercase">
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Predicted Label</th>
                  <th className="px-6 py-4 font-medium text-center">Confidence</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      {record.image_path ? (
                        <img 
                          src={`${backendHost}${record.image_path}`} 
                          alt="Crop" 
                          className="w-16 h-16 object-cover rounded-md border border-slate-200"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {record.predicted_label || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-2 py-1 bg-green-50 text-green-700 font-semibold rounded text-sm">
                        {record.confidence ? (record.confidence * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {record.created_at ? new Date(record.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
