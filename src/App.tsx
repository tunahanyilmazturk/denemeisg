/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { CompanyDetail } from './pages/CompanyDetail';
import { PersonnelPage } from './pages/Personnel';
import { PersonnelDetail } from './pages/PersonnelDetail';
import { NewPersonnelWizard } from './pages/NewPersonnelWizard';
import { NewCompanyWizard } from './pages/NewCompanyWizard';
import { Incidents } from './pages/Incidents';
import { NewIncidentWizard } from './pages/NewIncidentWizard';
import { IncidentDetail } from './pages/IncidentDetail';
import { Trainings } from './pages/Trainings';
import { NewTrainingWizard } from './pages/NewTrainingWizard';
import { Certificates } from './pages/Certificates';
import { NewCertificateWizard } from './pages/NewCertificateWizard';
import { PPEPage } from './pages/PPE';
import { RisksPage } from './pages/Risks';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { ProfilePage } from './pages/Profile';
import { LoginPage } from './pages/Login';
import { ForgotPasswordPage } from './pages/ForgotPassword';
import { useStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { useAppearance } from './hooks/useAppearance';

const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();
  
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore - React Router v6 Routes accepts key but types might complain */}
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={
            <ProtectedRoute requiredPermission={{ resource: 'companies', action: 'read' }}>
              <Companies />
            </ProtectedRoute>
          } />
          <Route path="companies/new" element={
            <ProtectedRoute requiredPermission={{ resource: 'companies', action: 'create' }}>
              <NewCompanyWizard />
            </ProtectedRoute>
          } />
          <Route path="companies/:id" element={
            <ProtectedRoute requiredPermission={{ resource: 'companies', action: 'read' }}>
              <CompanyDetail />
            </ProtectedRoute>
          } />
          <Route path="personnel" element={
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <PersonnelPage />
            </ProtectedRoute>
          } />
          <Route path="personnel/new" element={
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <NewPersonnelWizard />
            </ProtectedRoute>
          } />
          <Route path="personnel/:id" element={
            <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
              <PersonnelDetail />
            </ProtectedRoute>
          } />
          <Route path="incidents" element={
            <ProtectedRoute requiredPermission={{ resource: 'incidents', action: 'read' }}>
              <Incidents />
            </ProtectedRoute>
          } />
          <Route path="incidents/new" element={
            <ProtectedRoute requiredPermission={{ resource: 'incidents', action: 'create' }}>
              <NewIncidentWizard />
            </ProtectedRoute>
          } />
          <Route path="incidents/:id" element={
            <ProtectedRoute requiredPermission={{ resource: 'incidents', action: 'read' }}>
              <IncidentDetail />
            </ProtectedRoute>
          } />
          <Route path="trainings" element={
            <ProtectedRoute requiredPermission={{ resource: 'trainings', action: 'read' }}>
              <Trainings />
            </ProtectedRoute>
          } />
          <Route path="trainings/new" element={
            <ProtectedRoute requiredPermission={{ resource: 'trainings', action: 'create' }}>
              <NewTrainingWizard />
            </ProtectedRoute>
          } />
          <Route path="certificates" element={
            <ProtectedRoute requiredPermission={{ resource: 'trainings', action: 'read' }}>
              <Certificates />
            </ProtectedRoute>
          } />
          <Route path="certificates/new" element={
            <ProtectedRoute requiredPermission={{ resource: 'trainings', action: 'create' }}>
              <NewCertificateWizard />
            </ProtectedRoute>
          } />
          <Route path="ppe" element={
            <ProtectedRoute requiredPermission={{ resource: 'ppe', action: 'read' }}>
              <PPEPage />
            </ProtectedRoute>
          } />
          <Route path="risks" element={
            <ProtectedRoute requiredPermission={{ resource: 'risks', action: 'read' }}>
              <RisksPage />
            </ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute requiredPermission={{ resource: 'reports', action: 'read' }}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute requiredPermission={{ resource: 'settings', action: 'read' }}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const { isDarkMode } = useStore();
  const { checkAuth } = useAuthStore();
  useAppearance();

  useEffect(() => {
    // Check authentication on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-[#09090b] dark:text-slate-100 dark:border dark:border-slate-800 rounded-xl shadow-lg',
          duration: 3000,
        }}
      />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
