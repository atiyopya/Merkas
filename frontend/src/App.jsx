import React from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AlertProvider } from './context/AlertContext';
import Sidebar from './components/layout/Sidebar';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import { API_BASE_URL } from './api/apiConfig';
import './App.css';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import StockMovements from './pages/StockMovements';
import Customers from './pages/Customers';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import Debts from './pages/Debts';
import Reports from './pages/Reports';
import CustomerReport from './pages/CustomerReport';
import Profile from './pages/Profile';

import { AuthProvider } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';

// Google Chrome Cache Buster
axios.interceptors.request.use((config) => {
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: new Date().getTime(),
    };
  }
  return config;
});

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    const handleUnload = () => {
      // Pencere kapanırken hızlıca yedeği tetikle
      navigator.sendBeacon(`${API_BASE_URL}/api/backup`);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <AlertProvider>
            <SyncProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="app-container">
                        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                        <div className="main-content-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                          <main className="main-content">
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/inventory" element={<Inventory />} />
                              <Route path="/stock-movements" element={<StockMovements />} />
                              <Route path="/customers" element={<Customers />} />
                              <Route path="/sales" element={<Sales />} />
                              <Route path="/payments" element={<Payments />} />
                              <Route path="/debts" element={<Debts />} />
                              <Route path="/reports" element={<Reports />} />
                              <Route path="/customer-report" element={<CustomerReport />} />
                              <Route path="/profile" element={<Profile />} />
                            </Routes>
                          </main>
                        </div>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </SyncProvider>
          </AlertProvider>
        </AuthProvider>
      </Router>
    );
}

export default App;
