import React from 'react';

const GuidePage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">User Guide</h1>
      <div className="prose prose-slate lg:prose-lg">
        <p>Welcome to the AI Plant Disease Detection System. Follow these steps to analyze your crops:</p>
        <ol>
          <li>Navigate to the <strong>Predict</strong> page from the top menu.</li>
          <li>Upload an image of a plant leaf in `.jpg`, `.jpeg`, or `.png` format.</li>
          <li>Ensure the leaf is clearly visible and centered in the image.</li>
          <li>Wait a few seconds for our AI model to process the image.</li>
          <li>Review the <strong>Predicted Disease</strong> and the <strong>Confidence Score</strong>.</li>
          <li>Examine the <strong>Grad-CAM Heatmap</strong> to see which parts of the leaf the AI focused on to make its decision.</li>
        </ol>
      </div>
    </div>
  );
};

export default GuidePage;
