import React from 'react';
import { startUnlearning } from '../services/api';
import { PlayCircle } from 'lucide-react';

const UnlearningController = ({ setJobId }) => {
    
    const handleStart = async () => {
        try {
            const res = await startUnlearning({
                epochs: 3,
                lambda: 0.5,
                temperature: 2.0
            });
            setJobId(res.job_id);
            alert("Unlearning started with Job ID: " + res.job_id);
        } catch (e) {
            console.error(e);
            alert("Failed to start unlearning");
        }
    };

    return (
        <div className="bg-white border rounded-xl shadow-sm p-6 flex flex-col h-full justify-between items-center text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Unlearning Controller</h2>
            <p className="text-sm text-slate-500 mb-6">
                Trigger the Knowledge Distillation Unlearning pipeline to make the model "forget" noisy data points.
            </p>
            
            <button 
                onClick={handleStart}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-lg shadow-md transition-all flex items-center gap-2 transform hover:scale-105 active:scale-95"
            >
                <PlayCircle className="w-5 h-5"/>
                Start Knowledge Distillation Unlearning
            </button>
        </div>
    );
};

export default UnlearningController;
