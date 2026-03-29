import React from 'react';
import { AlertCircle, CheckCircle2, Info, ChevronRight, Play, Layers } from 'lucide-react';
import api from '../services/api';

const AnalyzeResults = ({ mode, singleResult, batchResults }) => {
  if (mode === 'single' && !singleResult) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
        <Info size={40} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Select an image to see analysis details</p>
      </div>
    );
  }

  if (mode === 'batch' && (!batchResults || batchResults.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-20 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-400">
        <Layers size={40} className="mb-4 opacity-20" />
        <p className="text-sm font-medium">Run batch analysis to see collective results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        {mode === 'single' ? 'Analysis Single Result' : 'Batch Analysis Results'}
        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full font-medium uppercase tracking-wider">
          {mode}
        </span>
      </h3>

      {mode === 'single' ? (
        <SingleResultCard result={singleResult} />
      ) : (
        <BatchResultTable results={batchResults} />
      )}
    </div>
  );
};

const SingleResultCard = ({ result }) => {
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  // CRITICAL: Defensive check
  if (!result) return (
    <div className="p-10 text-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
      <AlertCircle className="mx-auto mb-2 opacity-20" size={32} />
      <p className="text-sm font-medium">No result data available to display</p>
    </div>
  );

  const votes = [
    { id: 'v1', name: 'V1: ROI Focus (GradCAM)', score: result?.vote_scores?.v1_cam || 0, desc: 'Identifies if the model focuses on the correct object region.' },
    { id: 'v2', name: 'V2: Crop Invariance', score: result?.vote_scores?.v2_crop || 0, desc: 'Stability of prediction when the image is center-cropped.' },
    { id: 'v3', name: 'V3: Prediction Confidence', score: result?.vote_scores?.v3_loss || 0, desc: 'Baseline probability from the primary ResNet model.' },
    { id: 'v4', name: 'V4: TTA Stability (Rotation)', score: result?.vote_scores?.v4_tta || 0, desc: 'Consistency across 90, 180, and 270 degree rotations.' },
    { id: 'v5', name: 'V5: Ensemble Agreement', score: result?.vote_scores?.v5_ens || 0, desc: 'Consensus among ResNet, EfficientNet, DenseNet, and MobileNet.' },
  ];

  const totalScore = result?.vote_scores?.total_score || result?.total_score || 0;
  const isNoisy = result?.is_noisy || false;

  const handleSave = async () => {
    if (!result?.id) return;
    setSaving(true);
    try {
      await api.post('/dataset/analyze/save', {
        image_id: result.id,
        vote_scores: result.vote_scores,
        is_noisy: result.is_noisy
      });
      setSaved(true);
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save results");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start animate-in fade-in duration-500">
      {/* Image Preview */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
        <img 
          src={`/api/dataset/image/${result?.id}`} 
          alt="Original" 
          className="w-full rounded-lg shadow-inner bg-slate-100 min-h-[300px] object-cover"
          onError={(e) => e.target.src = 'https://via.placeholder.com/600?text=Image+Not+Found'}
        />
        <div className={`absolute top-6 right-6 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg backdrop-blur-md ${
          isNoisy ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'
        }`}>
          {isNoisy ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {isNoisy ? 'DETECTED AS NOISE' : 'CLEAN DATA'}
        </div>
      </div>

      {/* Vote Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h4 className="text-xl font-bold text-slate-800">Supreme Oracle Score</h4>
            <div className="text-sm text-slate-500">Real-time analysis from ML pipeline voters</div>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${isNoisy ? 'text-red-500' : 'text-emerald-500'}`}>
              {(totalScore * 100).toFixed(0)}%
            </span>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">confidence</div>
          </div>
        </div>

        <div className="space-y-6 flex-1">
          {votes.map((vote) => (
            <div key={vote.id} className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-sm font-bold text-slate-600">{vote.name}</span>
                <span className="text-sm font-mono font-bold text-slate-500">{(vote.score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${vote.score < 0.5 ? 'bg-red-500' : 'bg-blue-400'}`}
                  style={{ width: `${vote.score * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 px-1">{vote.desc}</p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-500 leading-relaxed italic flex-1">
            <Info size={14} className="inline mr-2 text-blue-500" />
            Analysis results are currently in <strong>DRAFT</strong> mode. Click save to persist them to the database.
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving || saved || !result?.id}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              saved 
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <CheckCircle2 size={16} />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved to DB' : 'Save Result'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BatchResultTable = ({ results }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Image</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Filename</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Label</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Score</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Result</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(results || []).length > 0 ? (
              results.map((img) => (
                <tr key={img?.id || Math.random()} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-3">
                    <img 
                      src={`/api/dataset/image/${img?.id}`} 
                      alt="" 
                      className="w-12 h-12 rounded-lg object-cover shadow-sm bg-slate-100"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Err'}
                    />
                  </td>
                  <td className="px-6 py-3">
                     <div className="text-sm font-bold text-slate-700 truncate max-w-xs">{img?.filename || 'Unnamed'}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold">
                      {img?.label || 'No Label'}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${img?.is_noisy ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${(img?.total_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-500">
                        {((img?.total_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      img?.is_noisy ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {img?.is_noisy ? <AlertCircle size={10} strokeWidth={3} /> : <CheckCircle2 size={10} strokeWidth={3} />}
                      {img?.is_noisy ? 'Noisy' : 'Clean'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                     <button className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                       <ChevronRight size={20} />
                     </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-20 text-center text-slate-400 font-medium italic">
                  No analysis results found in this dataset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyzeResults;
