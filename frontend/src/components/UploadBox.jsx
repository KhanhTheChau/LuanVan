import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { predictImage } from '../services/api';

const UploadBox = () => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const { 
    setImagePreview, 
    setPredictionResult, 
    setGradcamImage, 
    setIsPredicting 
  } = useAppContext();

  const handleFile = async (file) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid JPG or PNG image.");
      return;
    }
    
    setErrorMsg(null);
    
    // Generate preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Reset old state
    setPredictionResult(null);
    setGradcamImage(null);
    setIsPredicting(true);

    try {
      const data = await predictImage(file);
      setPredictionResult({
        predicted_class: data.predicted_class, // or data.label depending on backend mapping
        confidence: data.confidence,
        processing_time: data.processing_time
      });
      setGradcamImage(data.gradcam_base64);
    } catch (error) {
      console.error("Prediction Error:", error);
      setErrorMsg("Failed to predict image. See console for details.");
    } finally {
      setIsPredicting(false);
    }
  };

  const onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer bg-white ${
          dragActive ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'
        }`}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <UploadCloud size={48} className="text-slate-400 mb-4" />
        <p className="text-slate-700 font-medium mb-1 text-center">Drag & Drop Leaf Image Here</p>
        <p className="text-slate-500 text-sm text-center">or Click to Upload</p>
        <p className="text-slate-400 text-xs mt-4">Supported formats: JPG, JPEG, PNG (Max 5MB)</p>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/jpeg, image/jpg, image/png"
          onChange={handleChange}
          className="hidden"
        />
      </div>
      
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">
          {errorMsg}
        </div>
      )}
    </div>
  );
};

export default UploadBox;
