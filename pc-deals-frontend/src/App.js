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
  const [model, setModel] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [notificationPreferences, setNotificationPreferences] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.user_id) {  // Only set user and fetch favorites if we have a valid user_id
          setUser(parsed);
          fetchFavorites(parsed.user_id);
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
        localStorage.removeItem("user");  // Clear invalid data
      }
    }
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.user_id) {
          fetch(`${process.env.REACT_APP_API_URL}/api/notifications/preferences/${parsed.user_id}`, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
            }
          })
            .then(res => res.json())
            .then(data => setNotificationPreferences(data))
            .catch(err => console.error("Error fetching preferences:", err));
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
  }, [user]);

  const handleLoginSuccess = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.user_id) {  // Only set user and fetch favorites if we have a valid user_id
          setUser(parsed);
          fetchFavorites(parsed.user_id);
        }
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setFavorites([]);
  };

  const fetchFavorites = (userId) => {
    const token = localStorage.getItem("token");
  
    fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites?user_id=${userId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setFavorites(data);
        } else {
          console.warn("Unexpected response shape");
          setFavorites([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching favorites:", err);
        setFavorites([]);
      });
  };

  const handleRemoveFavorite = (model) => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    if (!storedUser || !token) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites?user_id=${storedUser.user_id}&model=${encodeURIComponent(model)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(() => fetchFavorites(storedUser.user_id));
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
                  {/* ... existing home page content ... */}
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
