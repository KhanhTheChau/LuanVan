import React from 'react';
import { Leaf } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Leaf className="text-green-600 w-8 h-8" />
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI Plant Disease Detection</h1>
            <p className="text-sm text-slate-500">AI-powered Crop Health Analysis</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-green-600 transition-colors">Home</a>
          <a href="#" className="hover:text-green-600 transition-colors">Predict</a>
          <a href="#" className="hover:text-green-600 transition-colors">Guide</a>
          <a href="#" className="hover:text-green-600 transition-colors">Policy</a>
          <a href="#" className="hover:text-green-600 transition-colors">About</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
