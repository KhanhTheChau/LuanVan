import React from 'react';

const PolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy & Terms of Use</h1>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-4">Data Collection</h2>
        <p className="text-slate-600 mb-6">
          Images uploaded to the prediction service may be temporarily processed in-memory for the 
          sole purpose of running the machine learning inference routine. The original images are 
          discarded after the session is completed and are not permanently stored in our training 
          datasets unless explicitly authorized by the user for background noise analysis.
        </p>
        
        <h2 className="text-xl font-bold mb-4">Dataset Usage</h2>
        <p className="text-slate-600">
          The PlantDoc and supplementary datasets utilized in this system are designated solely 
          for educational and academic research. They are subject to the original authors' licensing 
          agreements and cannot be reused for commercial profit.
        </p>
      </div>
    </div>
  );
};

export default PolicyPage;
