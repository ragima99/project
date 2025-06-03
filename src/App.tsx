import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Vehicles from './pages/Vehicles';

function App() {
  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/vehicles" element={<Vehicles />} />
            </Routes>
          </main>
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="container mx-auto px-4">
              <p className="text-center text-gray-600 text-sm">
                © 2025 LogiFlow - Logistics Management System
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;