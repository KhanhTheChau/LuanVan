import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

const UploadZone = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        alert("Please upload a valid image file.");
      }
    }
  }, [onFileSelect]);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
          ${isDragging ? 'border-green-500 bg-green-50 scale-[1.02]' : 'border-slate-300 hover:border-green-400 hover:bg-slate-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileUpload').click()}
      >
        <UploadCloud className={`w-16 h-16 mx-auto mb-4 ${isDragging ? 'text-green-500' : 'text-slate-400'}`} />
        <h3 className="text-lg font-medium text-slate-700 mb-2">Drag & Drop Leaf Image Here</h3>
        <p className="text-sm text-slate-500">or Click to Upload</p>
        <input 
          type="file" 
          id="fileUpload" 
          className="hidden" 
          accept="image/*"
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default UploadZone;
