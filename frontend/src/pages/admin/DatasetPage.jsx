import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const DatasetPage = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/images?limit=20');
        setData(res.data.images || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error("Error fetching dataset", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dataset Management</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <input 
            type="text" 
            placeholder="Search label..." 
            className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-64"
          />
          <span className="text-sm font-medium text-slate-500">Total: {total} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-100 text-slate-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Filename</th>
                <th className="px-6 py-4">Label</th>
                <th className="px-6 py-4">Split</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Noisy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8">No data found</td></tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 font-medium text-slate-800">{item.filename}</td>
                    <td className="px-6 py-3">{item.label}</td>
                    <td className="px-6 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{item.split || 'train'}</span></td>
                    <td className="px-6 py-3">{item.status || 'pending'}</td>
                    <td className="px-6 py-3 text-center">
                      {item.is_noisy 
                        ? <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">YES</span> 
                        : <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs">NO</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple pagination block */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500 bg-slate-50">
          <span>Showing {"1-20"} of {total}</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-50" disabled>Previous</button>
            <button className="px-3 py-1 border border-slate-300 rounded hover:bg-white">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetPage;
