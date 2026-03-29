import React, { useState, useEffect, useRef } from 'react';
import { Search, Play, Image as ImageIcon, Layers, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';

const AnalyzeControls = ({ onAnalyze, loading }) => {
  const [mode, setMode] = useState('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch initial images and search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/images?search=${searchTerm}&limit=50`);
        setImages(response.data.images);
      } catch (err) {
        console.error("Fetch images failed", err);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRun = () => {
    if (mode === 'single' && !selectedImage) {
      alert("Please select an image first");
      return;
    }
    onAnalyze({ mode, imageId: selectedImage?.id });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-8 mb-10 transition-all">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-8">
        
        {/* Left: Mode Toggle */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setMode('single')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all duration-300 ${
              mode === 'single' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon size={18} />
            <span className="font-bold text-sm tracking-tight">Single Image</span>
          </button>
          <button
            onClick={() => setMode('batch')}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-lg transition-all duration-300 ${
              mode === 'batch' ? 'bg-white shadow-md text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers size={18} />
            <span className="font-bold text-sm tracking-tight">Entire Dataset</span>
          </button>
        </div>

        {/* Center: Image Dropdown (Only for Single mode) */}
        <div className="flex-1 w-full max-w-2xl flex items-center gap-4">
          {mode === 'single' && (
            <div className="relative flex-1" ref={dropdownRef}>
              <div 
                className={`w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-2 rounded-xl cursor-pointer transition-all ${
                  showDropdown ? 'border-blue-500 bg-white ring-4 ring-blue-50' : 'border-slate-100 hover:border-slate-300'
                }`}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {selectedImage ? (
                    <>
                      <img 
                        src={`/api/dataset/image/${selectedImage.id}`} 
                        alt="" 
                        className="w-8 h-8 rounded-md object-cover border border-slate-200"
                        onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                      />
                      <span className="text-sm font-bold text-slate-700 truncate">{selectedImage.filename}</span>
                    </>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">Select image to analyze...</span>
                  )}
                </div>
                <ChevronDown size={20} className={`text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </div>

              {/* Dropdown Content */}
              {showDropdown && (
                <div className="absolute z-50 w-full mt-3 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by filename or label..."
                        autoFocus
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto py-2 custom-scrollbar">
                    {images.length > 0 ? (
                      images.map(img => (
                        <button
                          key={img.id}
                          onClick={() => {
                            setSelectedImage(img);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors group ${
                            selectedImage?.id === img.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <img 
                              src={`/api/dataset/image/${img.id}`} 
                              alt="" 
                              className="w-10 h-10 rounded-lg object-cover border border-slate-100 group-hover:border-blue-200 transition-all"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-700 truncate">{img.filename}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-400">{img.label}</div>
                            </div>
                          </div>
                          {selectedImage?.id === img.id && <Check size={18} className="text-blue-500" />}
                        </button>
                      ))
                    ) : (
                      <div className="py-10 text-center text-slate-400 text-sm font-medium">No images found</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right: Action Button */}
          <button
            onClick={handleRun}
            disabled={loading || (mode === 'single' && !selectedImage)}
            className={`flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-black text-sm uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 ${
              loading || (mode === 'single' && !selectedImage) 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {loading ? "Analyzing..." : mode === 'single' ? "Analyze Image" : "Analyze Dataset"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeControls;
