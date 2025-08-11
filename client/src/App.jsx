import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FamilyProvider, useFamily } from './contexts/FamilyContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import WeeklySummary from './pages/WeeklySummary';
import LoadingSpinner from './components/LoadingSpinner';
import FamilySetup from './components/FamilySetup';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, requireFamily = true }) => {
  const { user, loading, isAdmin } = useAuth();
  const { hasFamily, loading: familyLoading } = useFamily();

  if (loading || familyLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check if user needs family setup
  if (requireFamily && !hasFamily) {
    return <FamilySetup />;
  }

  return children;
};

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {user && <Navbar />}
      
      <main className={user ? 'pt-4' : ''}>
        <Routes>
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireFamily={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly requireFamily={true}>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/summary" 
            element={
              <ProtectedRoute requireFamily={true}>
                <WeeklySummary />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
          
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <FamilyProvider>
          <AppContent />
          <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '12px',
              padding: '16px',
              fontSize: '14px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        </FamilyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;