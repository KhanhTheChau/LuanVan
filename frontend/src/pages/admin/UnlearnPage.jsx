import React, { useState } from 'react';
import api from '../../services/api';
import { ShieldAlert } from 'lucide-react';

const UnlearnPage = () => {
  const [training, setTraining] = useState(false);
  const [jobId, setJobId] = useState(null);

  const startUnlearning = async () => {
    setTraining(true);
    try {
      const response = await api.post('/unlearn/start', { epochs: 3, lambda: 0.5, temperature: 2.0 });
      setJobId(response.data.job_id);
    } catch (err) {
      alert("Failed to start unlearning job.");
      console.error(err);
      setTraining(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Machine Unlearning Control</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <ShieldAlert size={24} className="text-red-500" />
            <h2 className="text-lg font-bold text-slate-800">Unlearning Controller</h2>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Execute Knowledge Distillation Unlearning to purge localized noisy data from the student model.
          </p>
          
          <button 
            onClick={startUnlearning}
            disabled={training}
            className={`w-full py-3 rounded-lg font-medium text-white transition ${training ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {training ? "Unlearning Job is Active..." : "Start Knowledge Distillation"}
          </button>
          
          {jobId && (
            <p className="mt-4 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
              Job ID: <span className="font-mono text-slate-700">{jobId}</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-center items-center h-64">
          <p className="text-slate-400 mb-2">Metrics Chart Placeholder</p>
          <p className="text-xs text-slate-400 text-center px-4">
            This section will poll <code>/api/unlearn/status/&lt;job_id&gt;</code> and render a LineChart using Recharts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnlearnPage;
