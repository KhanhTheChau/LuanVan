import React, { useState } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import UploadZone from '../components/UploadZone';
import ResultView from '../components/ResultView';
import { predictSingle } from '../services/api';

const InferencePage = () => {
    const [originalImage, setOriginalImage] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileSelect = async (file) => {
        setOriginalImage(file);
        setResult(null);
        setLoading(true);

        try {
            const data = await predictSingle(file);
            setResult(data);
        } catch (e) {
            console.error("Prediction failed: ", e);
            alert("Prediction failed. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <Header />
            <Navbar />
            
            <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center">
                <div className="text-center mb-12 animate-fade-in-up">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
                        Identify Plant Diseases Instantly
                    </h2>
                    <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
                        Upload an image of a leaf to let our advanced AI model analyze and detect potential diseases.
                    </p>
                </div>

                <div className="w-full">
                    <UploadZone onFileSelect={handleFileSelect} />
                </div>

                {loading && (
                    <div className="mt-12 text-center animate-pulse">
                        <div className="inline-block w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin mb-4"></div>
                        <p className="text-slate-600 font-medium tracking-wide">Analyzing leaf image with AI model...</p>
                    </div>
                )}

                {!loading && result && (
                    <ResultView result={result} originalImage={originalImage} />
                )}
            </main>
            
            <Footer />
        </div>
    );
};

export default InferencePage;
