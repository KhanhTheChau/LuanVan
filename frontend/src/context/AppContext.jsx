import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  // Global state for Prediction Pipeline
  const [imagePreview, setImagePreview] = useState(null);
  const [predictionResult, setPredictionResult] = useState(null); // { predicted_class: string, confidence: number, processing_time: number }
  const [gradcamImage, setGradcamImage] = useState(null); // Base64 string
  const [isPredicting, setIsPredicting] = useState(false);

  // You can add more global states here as needed (e.g., job_id for unlearning)

  const value = {
    imagePreview,
    setImagePreview,
    predictionResult,
    setPredictionResult,
    gradcamImage,
    setGradcamImage,
    isPredicting,
    setIsPredicting,
    
    // Helper to reset prediction state
    resetPrediction: () => {
      setImagePreview(null);
      setPredictionResult(null);
      setGradcamImage(null);
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
