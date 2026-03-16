import React from 'react';

const AboutPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">About the Project</h1>
      <div className="prose prose-slate bg-white p-6 rounded-lg shadow-sm border border-slate-200">
        <h3 className="font-semibold text-lg border-b pb-2 mb-4">Machine Unlearning for Computer Vision</h3>
        <p className="text-slate-600 mb-4">
          This system was developed as a Computer Science Thesis project to study the application and effects of Knowledge Distillation
          Unlearning in crop disease detection models. The core AI model is based on advanced architectures such as ResNet50.
        </p>
        <h4 className="font-semibold mt-4">Features</h4>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
          <li>Real-time PyTorch model inference</li>
          <li>Grad-CAM activation mappings</li>
          <li>Supreme Oracle noise detection pipeline</li>
          <li>Knowledge Distillation to unlearn poisoned datasets</li>
        </ul>
      </div>
    </div>
  );
};

export default AboutPage;
