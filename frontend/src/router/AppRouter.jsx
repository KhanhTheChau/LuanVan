import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import UserLayout from '../layouts/UserLayout';
import AdminLayout from '../layouts/AdminLayout';

// User Pages
import HomePage from '../pages/HomePage';
import PredictPage from '../pages/PredictPage';
import GuidePage from '../pages/GuidePage';
import AboutPage from '../pages/AboutPage';
import PolicyPage from '../pages/PolicyPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ProfilePage from '../pages/ProfilePage';

// Admin Pages
import DashboardPage from '../pages/admin/DashboardPage';
import DatasetPage from '../pages/admin/DatasetPage';
import AnalyzePage from '../pages/admin/AnalyzePage';
import UnlearnPage from '../pages/admin/UnlearnPage';
import FeedbackPage from '../pages/admin/FeedbackPage';

const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="predict" element={<PredictPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="pol" element={<PolicyPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        
        {/* Login/Register paths */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="analyze" element={<AnalyzePage />} />
          <Route path="unlearn" element={<UnlearnPage />} />
          <Route path="feedback" element={<FeedbackPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
