import React from 'react';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck } from 'lucide-react';

const PredictionCard = () => {
  const { predictionResult, isPredicting } = useAppContext();

  if (isPredicting) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[160px]">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium animate-pulse">Analyzing leaf image with AI model...</p>
      </div>
    );
  }

  if (!predictionResult) return null;

  const { predicted_class, confidence, processing_time } = predictionResult;
  // If your backend uses 'label' instead of 'predicted_class', adjust here.
  const label = predicted_class || predictionResult.label || 'Unknown';
  
  // Format confidence to percentage
  const confPercent = confidence ? (confidence * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
        <ShieldCheck className="text-green-500" size={24} />
        <h2 className="text-xl font-bold text-slate-800">Prediction Result</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">Predicted Disease</p>
          <p className="text-lg font-bold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
            {label}
          </p>
        </div>
        
        <div>
          <div className="flex justify-between mb-1">
            <p className="text-sm text-slate-500 font-medium">Confidence Score</p>
            <p className="text-sm font-bold text-green-600">{confPercent}%</p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div 
              className="bg-green-500 h-2.5 rounded-full" 
              style={{ width: `${confPercent}%` }}
            ></div>
          </div>
        </div>
        
        {processing_time && (
          <p className="text-xs text-slate-400 text-right mt-2">
            Processed in {processing_time.toFixed(3)}s
          </p>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;
