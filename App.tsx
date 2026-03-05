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
import { Reports } from './pages/Reports';
import { Home } from './pages/Home';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SelectClinic } from './pages/SelectClinic';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, selectedClinic, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando permissões...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!selectedClinic) {
    return <Navigate to="/select-clinic" replace />;
  }

  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f6f6f8] dark:bg-slate-950 transition-colors">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className={`flex-1 overflow-y-auto ${isHome ? 'p-0' : 'p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/select-clinic" element={<SelectClinic />} />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/:id" element={<PatientDetail />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/doctors/:id" element={<DoctorDetail />} />
                <Route path="/case/:id" element={<CaseDetails />} />
                <Route path="/new-order" element={<NewOrder />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings/*" element={<Settings />} />
                <Route path="/" element={<Home />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <HashRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-slate-800 dark:text-white',
              duration: 4000,
            }}
          />
          <AppRoutes />
        </HashRouter>
      </DarkModeProvider>
    </AuthProvider>
  );
};

export default App;