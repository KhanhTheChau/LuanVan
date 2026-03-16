import React, { useState } from 'react';
import api from '../../services/api';
import { ActivitySquare } from 'lucide-react';

const AnalyzePage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const response = await api.post('/dataset/analyze', { limit: 100 }); // Test limit
      setResult(response.data);
    } catch (err) {
      alert("Failed to run analysis");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dataset Analysis</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex flex-col items-center text-center">
          <ActivitySquare size={48} className="text-blue-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Supreme Oracle Pipeline</h2>
          <p className="text-slate-500 mb-8 max-w-lg">
            Run the Supreme Oracle Pipeline to scan the dataset and identify noisy labels.
            This assigns vote scores to images based on prediction heuristics.
          </p>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-opacity ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? "Analyzing Dataset..." : "Start Analysis (Limit 100)"}
          </button>
        </div>

        {result && (
          <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h3 className="font-bold text-slate-700 mb-2">Analysis Complete</h3>
            <p className="text-sm text-slate-600">Analyzed: {result.analyzed_count} images</p>
            <p className="text-sm text-red-600 font-medium mt-1">Found {result.noisy_images?.length || 0} noisy records</p>
            <div className="mt-4 max-h-40 overflow-y-auto bg-white border border-slate-200 rounded p-2 text-xs">
              <pre>{JSON.stringify(result.noisy_images, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzePage;
