import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Check, X, MessageSquare, AlertTriangle, RefreshCw } from 'lucide-react';

const FeedbackPage = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/feedback');
      setFeedbacks(res.data.feedbacks || []);
    } catch (err) {
      console.error("Failed to load feedback", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.post('/admin/feedback/update', {
        feedback_id: id,
        status: status
      });
      // Update local state directly for snappy UI
      setFeedbacks(feedbacks.map(f => f._id === id ? { ...f, status } : f));
    } catch (err) {
      console.error("Failed to update status", err);
      alert('Failed to update feedback status.');
    }
  };

  const getFeedbackTypeBadge = (type) => {
    switch(type) {
      case 'correct': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold flex items-center gap-1 w-fit"><Check size={12}/> Correct</span>;
      case 'incorrect': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-semibold flex items-center gap-1 w-fit"><X size={12}/> Incorrect</span>;
      case 'report': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-semibold flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Error</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">{type}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="text-green-600 font-medium">Approved</span>;
      case 'rejected': return <span className="text-red-600 font-medium">Rejected</span>;
      default: return <span className="text-amber-500 font-medium">Pending</span>;
    }
  };

  const backendHost = 'http://localhost:5000';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Feedback</h2>
          <p className="text-slate-500 text-sm mt-1">Review and manage prediction feedback from users</p>
        </div>
        <button 
          onClick={fetchFeedback}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm text-sm font-medium"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading feedback data...</div>
        ) : feedbacks.length === 0 ? (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center">
            <MessageSquare size={48} className="text-slate-300 mb-4" />
            <p>No feedback has been submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600 uppercase">
                  <th className="px-6 py-4 font-medium">Image</th>
                  <th className="px-6 py-4 font-medium">Predicted Label</th>
                  <th className="px-6 py-4 font-medium">Confidence</th>
                  <th className="px-6 py-4 font-medium">Feedback Type</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {feedbacks.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      {item.image_path ? (
                        (() => {
                          const fullUrl = `${backendHost}${item.image_path}`;
                          console.log("Feedback Image URL:", fullUrl);
                          return (
                            <img 
                              src={fullUrl} 
                              alt="Feedback" 
                              className="w-16 h-16 object-cover rounded-md border border-slate-200"
                              onError={(e) => {
                                e.target.onerror = null; 
                                e.target.src="https://via.placeholder.com/150?text=No+Image";
                              }}
                            />
                          );
                        })()
                      ) : (
                        <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center text-xs text-slate-400 border border-slate-200">No Image</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {item.predicted_label || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.confidence ? `${(item.confidence * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      {getFeedbackTypeBadge(item.feedback_type)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'approved')}
                          disabled={item.status === 'approved'}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                            item.status === 'approved' 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'rejected')}
                          disabled={item.status === 'rejected'}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                            item.status === 'rejected' 
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          Reject
                        </button>
                      </div>
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

export default FeedbackPage;
