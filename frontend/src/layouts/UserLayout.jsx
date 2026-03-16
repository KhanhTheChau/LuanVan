import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const UserLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default UserLayout
