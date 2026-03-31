import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AnalyzeControls from '../../components/AnalyzeControls';
import AnalyzeResults from '../../components/AnalyzeResults';
import { Activity } from 'lucide-react';

const AnalyzePage = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('single');
  const [singleResult, setSingleResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [error, setError] = useState(null);

  // Fetch already analyzed images for the batch table
  const fetchBatchResults = useCallback(async () => {
    try {
      // In a real app, we might want a specific 'analyzed=true' flag
      // For now, we fetch a large list and the component filters or we can use the existing backend
      const response = await api.get('/images?limit=100&sort_by=created_at&order=desc');
      // Filter images that have analysis data
      const analyzed = response.data.images.filter(img => img.V1 !== undefined);
      setBatchResults(analyzed);
    } catch (err) {
      console.error("Failed to fetch results", err);
    }
  }, []);

  useEffect(() => {
    fetchBatchResults();
  }, [fetchBatchResults]);

  const handleAnalyze = async ({ mode: selectedMode, imageId, limit }) => {
    setLoading(true);
    setError(null);
    setMode(selectedMode);
    
    try {
      console.log(`[FRONTEND] Starting ${selectedMode} analysis...`);
      if (selectedMode === 'single') {
        const response = await api.post('/dataset/analyze/single', { image_id: imageId });
        console.log("Analyze data:", response.data);
        console.log("[FRONTEND] Single Analysis Result Received:", response.data);
        
        const res = response.data;
        if (res && res.image_id) {
          setSingleResult({
            id: res.image_id,
            is_noisy: res.is_noisy || false,
            vote_scores: res.vote_scores || {},
            filename: res.filename || "In-Memory Analysis"
          });
        } else {
          throw new Error("Invalid response format from server");
        }
      } else {
        const response = await api.post('/dataset/analyze', { limit: limit || 100 });
        console.log("Analyze data:", response.data);
        console.log("[FRONTEND] Batch analysis task started:", response.data);
        alert("Batch analysis started in background. Results will appear as they are processed.");
        
        // Polling for updates every 3 seconds for 5 times
        let count = 0;
        const interval = setInterval(() => {
          console.log("[FRONTEND] Polling for batch results update...");
          fetchBatchResults();
          count++;
          if (count >= 5) clearInterval(interval);
        }, 3000);
      }
    } catch (err) {
      console.error("[FRONTEND] Analysis Error:", err);
      setError(err.response?.data?.error || err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Supreme Oracle Pipeline</h1>
          <p className="text-slate-400 font-medium mt-1">Noise Detection & Heuristic Data Analysis</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100">
          <Activity size={24} />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {/* Part 1: Controls */}
      <AnalyzeControls onAnalyze={handleAnalyze} loading={loading} />

      {/* Part 2: Results */}
      <div className="mt-12">
        <AnalyzeResults 
          mode={mode} 
          singleResult={singleResult} 
          batchResults={batchResults} 
        />
      </div>
    </div>
  );
};

export default AnalyzePage;
