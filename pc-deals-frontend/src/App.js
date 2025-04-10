import React, { useState, useEffect } from "react";
import GPUPriceHistoryViewer from "./components/GPUPriceHistoryViewer";
import UserAuthForm from "./components/UserAuthForm";
import FavoriteList from "./components/FavoriteList";
import PriceAlerts from "./components/PriceAlerts";
import MarketSnapshot from "./components/MarketSnapshot";
import Admin from './pages/Admin';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedModel, setSelectedModel] = useState("");
  const [notificationPreferences, setNotificationPreferences] = useState([]);

  useEffect(() => {
    // Check for stored token and user info on initial load
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLoginSuccess = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const handleFavoriteAdded = () => {
    // Refresh favorites list
    if (user) {
      fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites?user_id=${user.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })
        .then(res => res.json())
        .catch(err => console.error("Error fetching favorites:", err));
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          {/* Navigation */}
          <nav className="bg-white shadow-soft sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex-shrink-0 flex items-center">
                  <svg className="h-8 w-8 text-primary-DEFAULT" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <h1 className="ml-2 text-2xl font-bold text-gray-900">GPU Price Tracker</h1>
                </div>
                
                {/* Desktop navigation */}
                <div className="hidden sm:flex sm:items-center sm:ml-6">
                  <UserAuthForm onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
                  {user && user.isAdmin && (
                    <Link to="/admin" className="ml-4 text-gray-700 hover:text-gray-900">
                      Admin Dashboard
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/admin" element={<Admin />} />
              <Route path="/" element={
                <>
                  {/* Market Snapshot - Full Width */}
                  <div className="mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-semibold mb-4">Market Snapshot</h2>
                      <MarketSnapshot />
                    </div>
                  </div>

                  {/* Two Column Layout for Favorites/Alerts and Price History */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column - Favorites and Alerts */}
                    <div className="space-y-8">
                      {user && (
                        <>
                          <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Favorite GPUs</h2>
                            <FavoriteList user={user} token={token} />
                          </div>
                          <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold mb-4">Price Alerts</h2>
                            <PriceAlerts 
                              user={user}
                              token={token}
                              notificationPreferences={notificationPreferences}
                              setNotificationPreferences={setNotificationPreferences}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Column - Price History */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h2 className="text-xl font-semibold mb-4">Price History</h2>
                      <GPUPriceHistoryViewer 
                        model={selectedModel}
                        setModel={setSelectedModel}
                        onFavoriteAdded={handleFavoriteAdded}
                        notificationPreferences={notificationPreferences}
                        setNotificationPreferences={setNotificationPreferences}
                      />
                    </div>
                  </div>
                </>
              } />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-white mt-12 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <p className="text-gray-600">© 2025 GPU Deal Analyzer. All rights reserved.</p>
                <p className="text-gray-500 mt-2">
                  <em>Powered by Spring Boot & React</em>
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Disclaimer: Prices and listings are for informational purposes only.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
