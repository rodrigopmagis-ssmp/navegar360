import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { CaseDetails } from './pages/CaseDetails';
import { NewOrder } from './pages/NewOrder';
import { Patients } from './pages/Patients';
import { PatientDetail } from './pages/PatientDetail';
import { Doctors } from './pages/Doctors';
import { DoctorDetail } from './pages/DoctorDetail';
import { Settings } from './pages/Settings';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isLoginPage = location.pathname.toLowerCase().includes('login') || location.pathname === '/';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f6f8] dark:bg-slate-950 transition-colors">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DarkModeProvider>
      <HashRouter>
        <Layout>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-slate-800 dark:text-white',
              duration: 4000,
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:id" element={<DoctorDetail />} />
            <Route path="/case/:id" element={<CaseDetails />} />
            <Route path="/new-order" element={<NewOrder />} />
            <Route path="/settings/*" element={<Settings />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Layout>
      </HashRouter>
    </DarkModeProvider>
  );
};

export default App;