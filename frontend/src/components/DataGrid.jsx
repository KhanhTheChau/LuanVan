import React, { useEffect, useState } from 'react';
import { getDataset } from '../services/api';

const DataGrid = () => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getDataset(100, 0); // initial load
            setImages(data.images || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
            <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Dataset Explorer</h3>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-medium">{images.length} records</span>
            </div>
            
            <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-3 font-medium">Image Name</th>
                            <th className="px-6 py-3 font-medium">Label</th>
                            <th className="px-6 py-3 font-medium">Split</th>
                            <th className="px-6 py-3 font-medium">V1</th>
                            <th className="px-6 py-3 font-medium">V2</th>
                            <th className="px-6 py-3 font-medium">V3</th>
                            <th className="px-6 py-3 font-medium">V4</th>
                            <th className="px-6 py-3 font-medium">V5</th>
                            <th className="px-6 py-3 font-medium">Total Score</th>
                            <th className="px-6 py-3 font-medium rounded-tr-lg">Is Noisy</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr><td colSpan="10" className="text-center py-8 text-slate-400">Loading dataset...</td></tr>
                        )}
                        {!loading && images.map((img, idx) => (
                            <tr 
                                key={idx} 
                                className={`border-b transition-colors hover:bg-slate-50 
                                            ${img.is_noisy ? 'bg-red-50/50 border-red-100 hover:bg-red-50' : ''}`}
                            >
                                <td className="px-6 py-4 font-medium text-slate-700 max-w-[200px] truncate" title={img.filename}>{img.filename}</td>
                                <td className="px-6 py-4 text-slate-600">{img.label}</td>
                                <td className="px-6 py-4"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{img.split}</span></td>
                                <td className="px-6 py-4">{img.V1 || '-'}</td>
                                <td className="px-6 py-4">{img.V2 || '-'}</td>
                                <td className="px-6 py-4">{img.V3 || '-'}</td>
                                <td className="px-6 py-4">{img.V4 || '-'}</td>
                                <td className="px-6 py-4">{img.V5 || '-'}</td>
                                <td className="px-6 py-4 font-semibold text-slate-700">{img.total_score ? img.total_score.toFixed(2) : '-'}</td>
                                <td className="px-6 py-4">
                                    {img.is_noisy ? (
                                        <span className="text-red-500 font-medium bg-red-100 px-2 py-1 rounded text-xs uppercase tracking-wider">Noisy</span>
                                    ) : (
                                        <span className="text-green-500 font-medium bg-green-100 px-2 py-1 rounded text-xs uppercase tracking-wider">Clean</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataGrid;
