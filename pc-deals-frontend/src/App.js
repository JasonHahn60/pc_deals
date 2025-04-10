import React, { useState, useEffect } from "react";
import GPUPriceHistoryViewer from "./components/GPUPriceHistoryViewer";
import UserAuthForm from "./components/UserAuthForm";
import FavoriteList from "./components/FavoriteList";
import PriceAlerts from "./components/PriceAlerts";
import MarketSnapshot from "./components/MarketSnapshot";

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
          fetch(`http://localhost:8080/api/notifications/preferences/${parsed.user_id}`, {
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
  
    fetch(`http://localhost:8080/api/users/favorites?user_id=${userId}`, {
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

    fetch(`http://localhost:8080/api/users/favorites?user_id=${storedUser.user_id}&model=${encodeURIComponent(model)}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(() => fetchFavorites(storedUser.user_id));
  };

  return (
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
            
            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-light"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:flex sm:items-center sm:ml-6">
              <UserAuthForm onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} sm:hidden bg-white border-t border-gray-200`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <UserAuthForm onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-r-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Log in to save favorites and access personalized features.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Market Overview Section */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-soft">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="h-6 w-6 mr-2 text-primary-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Market Overview
              </h2>
              <MarketSnapshot />
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Favorites Column */}
          {user && (
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-soft p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-secondary-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Your Favorites
                </h2>
                <FavoriteList
                  favorites={favorites}
                  onSelectFavorite={setModel}
                  onRemove={handleRemoveFavorite}
                />
              </div>

              <PriceAlerts 
                notificationPreferences={notificationPreferences}
                setNotificationPreferences={setNotificationPreferences}
              />
            </div>
          )}

          {/* Main Content Column */}
          <div className={`${user ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <GPUPriceHistoryViewer
              model={model}
              setModel={setModel}
              onFavoriteAdded={user ? () => fetchFavorites(user.user_id) : undefined}
              notificationPreferences={notificationPreferences}
              setNotificationPreferences={setNotificationPreferences}
            />
          </div>
        </div>
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
  );
}

export default App;
