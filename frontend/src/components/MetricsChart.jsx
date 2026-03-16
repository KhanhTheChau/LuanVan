import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MetricsChart = ({ metrics }) => {
    if (!metrics || metrics.length === 0) {
        return (
            <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 border rounded-xl shadow-inner border-slate-200">
                <p className="text-slate-400 font-medium">No training metrics available yet. Start a job to see real-time updates.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full opacity-0 animate-fade-in-up" style={{animationFillMode: 'forwards'}}>
            {/* Loss Chart */}
            <div className="bg-white border rounded-xl shadow-sm p-4 h-80">
                <h3 className="text-center font-semibold text-slate-700 mb-4 text-sm uppercase tracking-widest">Loss Monitoring</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="epoch" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
                        <Line type="monotone" dataKey="ce_loss" name="CE Loss" stroke="#ef4444" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" dataKey="kl_loss" name="KL Loss" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Validation Accuracy Chart */}
            <div className="bg-white border rounded-xl shadow-sm p-4 h-80">
                <h3 className="text-center font-semibold text-slate-700 mb-4 text-sm uppercase tracking-widest">Validation Accuracy</h3>
                <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="epoch" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 1]} tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                        <Legend wrapperStyle={{fontSize: "12px", paddingTop: "10px"}}/>
                        <Line type="monotone" dataKey="val_accuracy" name="Val Accuracy" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MetricsChart;
