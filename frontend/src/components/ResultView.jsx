import React from 'react';

const ResultView = ({ result, originalImage }) => {
  if (!result) return null;

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 bg-white rounded-xl shadow-lg border p-6 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-2">Prediction Result</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Original Image */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">Original Image</h3>
          <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex items-center justify-center">
             {originalImage ? (
                <img src={URL.createObjectURL(originalImage)} alt="Original" className="w-full h-full object-contain" />
             ) : (
                <span className="text-slate-400">No Image</span>
             )}
          </div>
        </div>

        {/* GradCAM Result */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-green-600 mb-3">Grad-CAM Visualization</h3>
          <div className="w-full h-80 rounded-lg overflow-hidden border border-slate-200 shadow-inner bg-slate-50 flex items-center justify-center relative">
              {result?.gradcam_base64 ? (
                <img src={result.gradcam_base64} alt="Grad-CAM heatmap" className="w-full h-full object-contain" />
              ) : (
                 <span className="text-slate-400 text-sm italic py-4">Grad-CAM rendering...</span>
              )}
          </div>
        </div>
      </div>

      {/* Outcome Banner */}
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-100 flex flex-col md:flex-row justify-between items-center">
         <div>
            <p className="text-sm text-green-800 font-medium mb-1">Predicted Disease</p>
            <p className="text-3xl font-bold text-green-600">{result?.predicted_class || 'Unknown'}</p>
         </div>
         <div className="mt-4 md:mt-0 md:text-right">
            <p className="text-sm text-green-800 font-medium mb-1">Confidence</p>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-700">
                    {result?.confidence ? (result.confidence * 100).toFixed(1) : 0}%
                </span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default ResultView;
