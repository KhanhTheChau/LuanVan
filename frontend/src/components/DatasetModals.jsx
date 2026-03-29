import React, { useState } from 'react';
import { X, Save, Trash2, UploadCloud, Info } from 'lucide-react';
import api from '../services/api';

// --- View Modal ---
export const DatasetViewModal = ({ isOpen, onClose, item }) => {
  if (!isOpen || !item) return null;

  const imageUrl = `${api.defaults.baseURL}/dataset/image/${item.id}`;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" /> Image Details
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 flex justify-center items-start bg-slate-100 rounded-lg p-2 border border-slate-200">
            <img 
              src={imageUrl} 
              alt={item.filename}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/300?text=No+Image' }}
              className="max-w-full rounded shadow-sm"
            />
          </div>
          <div className="w-full md:w-1/2 space-y-4 text-sm text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Filename</p>
              <p className="break-all bg-slate-50 p-2 rounded border border-slate-100 mt-1">{item.filename}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Label</p>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">{item.label}</span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Data Split</p>
              <p className="mt-1 capitalize">{item.split || 'train'}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Status</p>
              <span className={`inline-block mt-1 px-2 py-1 rounded-md font-medium ${item.status === 'processed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                {item.status || 'pending'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-800">Is Noisy?</p>
              <p className="mt-1">{item.is_noisy ? <span className="text-red-600 font-bold">Yes</span> : 'No'}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Edit Modal ---
export const DatasetEditModal = ({ isOpen, onClose, item, onSave }) => {
  const [label, setLabel] = useState(item?.label || '');
  const [split, setSplit] = useState(item?.split || 'train');
  const [isNoisy, setIsNoisy] = useState(item?.is_noisy || false);
  const [loading, setLoading] = useState(false);

  // Update effect when item changes
  React.useEffect(() => {
    if (item) {
      setLabel(item.label);
      setSplit(item.split || 'train');
      setIsNoisy(item.is_noisy || false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/dataset/${item.id}`, { label, data_split: split, is_noisy: isNoisy });
      onSave(); // trigger refresh
    } catch (err) {
      alert("Failed to update dataset item");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Edit Dataset Item</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Label</label>
            <input 
              type="text" 
              required
              value={label} 
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Split</label>
            <select 
              value={split} 
              onChange={e => setSplit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="train">Train</option>
              <option value="val">Validation</option>
              <option value="test">Test</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-4 text-sm">
            <input 
              type="checkbox" 
              id="is_noisy"
              checked={isNoisy} 
              onChange={e => setIsNoisy(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_noisy" className="text-slate-700 cursor-pointer">Mark as Noisy Data</label>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Add Modal ---
export const DatasetAddModal = ({ isOpen, onClose, onSave }) => {
  const [files, setFiles] = useState([]);
  const [label, setLabel] = useState('');
  const [split, setSplit] = useState('train');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return alert("Please select files to upload");
    
    setLoading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(f => formData.append('images', f));
      formData.append('label', label);
      formData.append('split', split);
      
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      // Retrieve auth token exactly like interceptor doesn't apply to multipart manually sometimes
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;

      await api.post('/dataset/add', formData, config);
      
      // reset and close
      setFiles([]);
      setLabel('');
      onSave(); // refresh list
    } catch (err) {
      alert("Failed to upload images");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Add New Dataset Images</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Images to Upload</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-lg hover:bg-slate-50 transition-colors focus-within:ring-2 focus-within:ring-blue-500">
              <div className="space-y-1 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload files</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      multiple 
                      className="sr-only" 
                      onChange={e => setFiles(e.target.files)}
                      accept="image/jpeg, image/png, image/jpg"
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500">
                  {files.length > 0 ? `${files.length} file(s) selected` : "PNG, JPG up to 5MB"}
                </p>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Label</label>
            <input 
              type="text" 
              required
              value={label} 
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Tomato target spot"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data Split</label>
            <select 
              value={split} 
              onChange={e => setSplit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="train">Train</option>
              <option value="val">Validation</option>
              <option value="test">Test</option>
            </select>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || files.length === 0} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
              <UploadCloud className="w-4 h-4" /> {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
