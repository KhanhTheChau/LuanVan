import api from '../services/api'; 
import { AlertCircle, Image as ImageIcon, Eye, Edit2, Trash2 } from 'lucide-react';

const DatasetTable = ({ data, loading, onView, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading dataset...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-slate-50">
        <ImageIcon className="w-16 h-16 mb-4 text-slate-300" />
        <p className="text-lg font-medium text-slate-600">No data found</p>
        <p className="text-sm">Try adjusting your search or sort filters</p>
      </div>
    );
  }

  // Handle fallback image
  const handleImageError = (e) => {
    e.target.onerror = null; 
    e.target.src = 'https://via.placeholder.com/150?text=No+Image';
    e.target.className = 'w-16 h-16 object-cover rounded-md border border-slate-200 opacity-50';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-semibold">
          <tr>
            <th className="px-6 py-4 w-24 text-center">Image</th>
            <th className="px-6 py-4">Filename</th>
            <th className="px-6 py-4">Label</th>
            <th className="px-6 py-4">Split</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-center">Noisy</th>
            <th className="px-6 py-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map(item => {
            const imageUrl = `${api.defaults.baseURL}/dataset/image/${item.id}`;
            return (
              <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                <td className="px-6 py-3 text-center align-middle">
                  <div className="relative inline-block">
                    <img 
                      src={imageUrl} 
                      alt={item.filename}
                      onError={handleImageError}
                      className="w-16 h-16 object-cover rounded-md shadow-sm border border-slate-200 group-hover:shadow transition-shadow"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td className="px-6 py-3 font-medium text-slate-800 align-middle truncate max-w-[200px]" title={item.filename}>
                  {item.filename}
                </td>
                <td className="px-6 py-3 align-middle">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {item.label}
                  </span>
                </td>
                <td className="px-6 py-3 align-middle">
                  <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-medium">
                    {item.split || 'train'}
                  </span>
                </td>
                <td className="px-6 py-3 align-middle">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'processed' ? 'bg-green-100 text-green-700' : 
                    item.status === 'error' ? 'bg-red-100 text-red-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status || 'pending'}
                  </span>
                </td>
                <td className="px-6 py-3 text-center align-middle">
                  {item.is_noisy 
                    ? <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold bg-red-50 text-red-600 border border-red-100">YES</span> 
                    : <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-600 border border-green-100">NO</span>}
                </td>
                <td className="px-6 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onView(item)}
                      title="View Details"
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onEdit(item)}
                      title="Edit Item"
                      className="p-1.5 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(item)}
                      title="Delete Item"
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DatasetTable;
