import React from 'react';
import { Search, SortAsc, SortDesc } from 'lucide-react';

const DatasetFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder,
  total 
}) => {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
      {/* Search Input */}
      <div className="relative w-full md:w-80">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by filename or label..." 
          className="pl-10 px-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Sort By Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="created_at">Date Added</option>
          <option value="filename">Filename</option>
          <option value="label">Label</option>
          <option value="split">Split Type</option>
        </select>

        {/* Sort Order Toggle */}
        <button
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="p-2 border border-slate-300 rounded-lg hover:bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-slate-50 flex items-center gap-1"
          title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
        >
          {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
          <span className="text-sm font-medium sr-only md:not-sr-only">
            {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
          </span>
        </button>

        <div className="text-sm font-medium text-slate-500 border-l border-slate-300 pl-3">
          Total: <span className="text-blue-600 font-bold">{total}</span>
        </div>
      </div>
    </div>
  );
};

export default DatasetFilters;
