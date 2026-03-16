import React, { useState } from 'react';
import Header from '../components/Header';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DataGrid from '../components/DataGrid';
import UnlearningController from '../components/UnlearningController';
import MetricsChart from '../components/MetricsChart';
import useUnlearningStatus from '../hooks/useUnlearningStatus';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

const DashboardPage = () => {
    const [jobId, setJobId] = useState(null);
    const { status, metrics, error } = useUnlearningStatus(jobId);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <Header />
            <Navbar />
            
            <main className="flex-grow container mx-auto px-4 py-8">
                
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                            Thesis Control Center
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Monitor dataset records and execute Knowledge Distillation Unlearning.</p>
                    </div>

                    {/* Status Pill */}
                    {jobId && (
                        <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Status:</span>
                            {status === 'processing' && <span className="flex items-center gap-1 text-sm font-bold text-blue-600"><RefreshCw className="w-4 h-4 animate-spin"/> Processing</span>}
                            {status === 'completed' && <span className="flex items-center gap-1 text-sm font-bold text-green-600"><CheckCircle2 className="w-4 h-4"/> Completed</span>}
                            {status === 'failed' && <span className="flex items-center gap-1 text-sm font-bold text-red-600"><AlertCircle className="w-4 h-4"/> Failed</span>}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                    <div className="lg:col-span-3 h-[400px]">
                        <DataGrid />
                    </div>
                    <div className="lg:col-span-1 h-[400px]">
                        <UnlearningController setJobId={setJobId} />
                    </div>
                </div>

                <div className="w-full">
                    <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800">Real-time Training Metrics</h3>
                        {jobId && <span className="text-xs font-mono text-slate-400 bg-slate-200 px-2 py-1 rounded">Job: {jobId}</span>}
                    </div>
                    <MetricsChart metrics={metrics} />
                    
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-medium flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold">Error executing unlearning job</h4>
                                <p className="text-sm opacity-90 mt-1">{error}</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default DashboardPage;
