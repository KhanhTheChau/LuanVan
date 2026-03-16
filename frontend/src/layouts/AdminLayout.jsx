import React, { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const AdminLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'admin') {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Optional Topbar can go here */}
        <header className="bg-white shadow border-b border-slate-200 py-4 px-6 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-700">Thesis Control Center</h1>
            <div className="flex items-center gap-4">
              <div className="text-sm border border-slate-200 px-3 py-1 rounded bg-slate-50 text-slate-500">Admin Mode</div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('role');
                  navigate('/login');
                }}
                className="text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                Logout
              </button>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
