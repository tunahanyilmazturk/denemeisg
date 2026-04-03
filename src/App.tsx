/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import { PersonnelPage } from './pages/Personnel';
import { Incidents } from './pages/Incidents';
import { NewIncidentWizard } from './pages/NewIncidentWizard';
import { Trainings } from './pages/Trainings';
import { PPEPage } from './pages/PPE';
import { RisksPage } from './pages/Risks';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { useStore } from './store/useStore';

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore - React Router v6 Routes accepts key but types might complain */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="personnel" element={<PersonnelPage />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="incidents/new" element={<NewIncidentWizard />} />
          <Route path="trainings" element={<Trainings />} />
          <Route path="ppe" element={<PPEPage />} />
          <Route path="risks" element={<RisksPage />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  const { isDarkMode } = useStore();

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
