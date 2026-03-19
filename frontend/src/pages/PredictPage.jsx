import React, { useEffect, useState } from 'react';
import UploadBox from '../components/UploadBox';
import PredictionCard from '../components/PredictionCard';
import GradCAMViewer from '../components/GradCAMViewer';
import { useAppContext } from '../context/AppContext';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import api from '../services/api';

const PredictPage = () => {
  const { predictionResult, isPredicting, resetPrediction } = useAppContext();
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Reset state when mounting the page so it's clean
  useEffect(() => {
    resetPrediction();
    setFeedbackMsg('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFeedback = async (type) => {
    setFeedbackMsg('Cảm ơn bạn đã phản hồi');
    console.log(`Sending feedback: ${type}`);
    try {
      await api.post('/predict_feedback', {
        image_path: predictionResult?.image_path,
        predicted_label: predictionResult?.predicted_class || 'unknown',
        confidence: predictionResult?.confidence || 0,
        feedback_type: type
      });
    } catch (err) {
      console.warn("Feedback API not available yet. Logged to console.");
    }
    setTimeout(() => setFeedbackMsg(''), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Crop Health Analysis</h1>
        <p className="mt-2 text-slate-500">
          Upload a clear image of a leaf to identify diseases instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          {/* Upload Block */}
          <div className="rounded-2xl shadow-md p-4 bg-white h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Upload image</h3>
            <UploadBox />
          </div>

          {/* Model Information Card */}
          <div className="rounded-2xl shadow-md p-4 bg-white h-fit">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
              <Info className="text-blue-500" size={20} />
              <h3 className="text-lg font-bold text-slate-800">Model Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Model Name:</span>
                <span className="font-semibold text-slate-800 text-right">PlantDoc Disease Classifier</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Architecture:</span>
                <span className="font-semibold text-slate-800 text-right">ResNet50</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Training Dataset:</span>
                <span className="font-semibold text-slate-800 text-right">PlantDoc2</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Accuracy:</span>
                <span className="font-semibold text-green-600 text-right">92%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Visual Analysis Block (GradCAM + Results) */}
          <div className="rounded-2xl shadow-md p-4 bg-white h-fit min-h-[400px]">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Visual Analysis (GradCAM)</h3>
            {!predictionResult && !isPredicting ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Info size={48} className="mb-2 opacity-20" />
                <p>Upload an image to see analysis results</p>
              </div>
            ) : (
              <div className="space-y-4">
                <PredictionCard />
                <GradCAMViewer />
              </div>
            )}
          </div>

          {/* Prediction Feedback */}
          {predictionResult && (
            <div className="rounded-2xl shadow-md p-4 bg-white h-fit">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Prediction Feedback</h3>
              <p className="text-sm text-slate-500 mb-4">Đánh giá kết quả của AI để giúp cải thiện mô hình:</p>
              
              {feedbackMsg ? (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg text-center font-medium border border-green-200">
                  {feedbackMsg}
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => handleFeedback('correct')} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition text-sm font-medium">
                    <CheckCircle size={16} /> Dự đoán đúng
                  </button>
                  <button onClick={() => handleFeedback('incorrect')} className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition text-sm font-medium">
                    <XCircle size={16} /> Dự đoán sai
                  </button>
                  <button onClick={() => handleFeedback('report')} className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 transition text-sm font-medium">
                    <AlertTriangle size={16} /> Báo cáo lỗi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PredictPage;
