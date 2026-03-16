import React from 'react';
import { useAppContext } from '../context/AppContext';

const GradCAMViewer = () => {
  const { imagePreview, gradcamImage, isPredicting } = useAppContext();

  if (!imagePreview && !gradcamImage && !isPredicting) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mt-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Visual Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original Image */}
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Original Image</p>
          <div className="w-full aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2">
            {imagePreview ? (
              <img src={imagePreview} alt="Original Leaf" className="max-w-full max-h-full object-contain rounded" />
            ) : (
              <span className="text-slate-400">Loading...</span>
            )}
          </div>
        </div>

        {/* Grad-CAM Heatmap */}
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Grad-CAM Visualization</p>
          <div className="w-full aspect-square bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center p-2 relative">
            {isPredicting ? (
              <span className="text-slate-400 animate-pulse">Generating Heatmap...</span>
            ) : gradcamImage ? (
              <img src={gradcamImage} alt="Grad-CAM Heatmap" className="max-w-full max-h-full object-contain rounded" />
            ) : (
              <span className="text-slate-400">{imagePreview ? 'Waiting for prediction...' : 'No data'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradCAMViewer;
