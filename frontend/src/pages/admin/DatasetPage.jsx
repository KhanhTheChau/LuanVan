import React, { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import api from '../../services/api';
import DatasetFilters from '../../components/DatasetFilters';
import DatasetTable from '../../components/DatasetTable';
import { DatasetViewModal, DatasetEditModal, DatasetAddModal } from '../../components/DatasetModals';

const DatasetPage = () => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filtering and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const limit = 20;

  // Modals Data State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounce effect for search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, sortOrder]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/images', {
        params: {
          limit: limit,
          skip: (page - 1) * limit,
          search: debouncedSearch,
          sort_by: sortBy,
          order: sortOrder
        }
      });
      setData(res.data.images || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Error fetching dataset", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, sortBy, sortOrder, page, limit, refreshTrigger]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    // Also close modals if they were open just to be clean
    setEditModalOpen(false);
    setAddModalOpen(false);
  };

  // Action Handlers
  const handleView = async (item) => {
    // Optionally fetch full info, but for now passing item is good enough
    // if backend added more details, we could fetch here
    try {
      const res = await api.get(`/dataset/${item.id}/info`);
      setSelectedItem(res.data);
      setViewModalOpen(true);
    } catch {
      // fallback
      setSelectedItem(item);
      setViewModalOpen(true);
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.filename}? This action cannot be undone.`)) {
      try {
        await api.delete(`/dataset/${item.id}`);
        triggerRefresh();
      } catch (err) {
        alert("Failed to delete dataset record");
        console.error(err);
      }
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dataset Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage, annotate and upload dataset images</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 py-0.5 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {total} Total Records
          </div>
          <button 
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Dataset
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <DatasetFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          sortBy={sortBy} 
          setSortBy={setSortBy} 
          sortOrder={sortOrder} 
          setSortOrder={setSortOrder}
          total={total}
        />

        <DatasetTable 
          data={data} 
          loading={loading} 
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        
        {/* Pagination block */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 bg-slate-50">
          <span>
            {total > 0 && !loading ? (
              <>
                Showing <span className="font-medium text-slate-700">{(page - 1) * limit + 1}-{Math.min(page * limit, total)}</span> of <span className="font-medium text-slate-700">{total}</span>
              </>
            ) : "0 records shown"}
          </span>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm font-medium text-slate-600"
            >
              Previous
            </button>
            <span className="px-3 font-medium text-slate-700">Page {page} of {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm font-medium text-slate-600"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Render Modals */}
      <DatasetViewModal 
        isOpen={viewModalOpen} 
        onClose={() => setViewModalOpen(false)} 
        item={selectedItem} 
      />
      <DatasetEditModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        item={selectedItem} 
        onSave={triggerRefresh}
      />
      <DatasetAddModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
        onSave={triggerRefresh}
      />
    </div>
  );
};

export default DatasetPage;
