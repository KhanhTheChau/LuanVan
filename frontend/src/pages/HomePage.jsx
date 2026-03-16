import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl md:text-6xl tracking-tight">
          AI Plant Disease <span className="text-green-600">Detection</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-xl text-slate-500">
          Upload leaf images and get instant artificial intelligence-powered disease analysis.
          Powered by Deep Learning and Grad-CAM visualization.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link to="/predict" className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium shadow hover:bg-green-700 transition">
            Start Prediction
          </Link>
          <Link to="/guide" className="px-8 py-3 bg-white text-slate-700 border border-slate-300 rounded-lg font-medium shadow-sm hover:bg-slate-50 transition">
            Read User Guide
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
