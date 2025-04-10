import React, { useState, useEffect, useCallback } from "react";
import PriceHistoryChart from "./PriceHistoryChart";
import GPUSelector from "./GPUSelector";

const getScoreColor = (score) => {
  const colorMap = {
    0: "#ef4444",   // Red
    1: "#f97316",   // Red-Orange
    2: "#fb923c",   // Orange
    3: "#facc15",   // Yellow
    4: "#a3e635",   // Yellow-Green
    5: "#4ade80",   // Light Green 
    6: "#22c55e",   // Medium Green
    7: "#16a34a",   // Darker Green
    8: "#15803d",   // Deep Green
    9: "#166534",   // Forest Green
    10: "#7e22ce"   // Royal Purple 
  };

  return colorMap[score] || "#d1d5db";
};

const GPUPriceHistoryViewer = ({ model, setModel, onFavoriteAdded, notificationPreferences, setNotificationPreferences }) => {
  const [price, setPrice] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [message, setMessage] = useState("");
  const [notificationThreshold, setNotificationThreshold] = useState("");

  // Reset states when model changes
  useEffect(() => {
    setAnalysis(null);
    setPrice("");
    setMessage("");
  }, [model]);

  // Fetch notification preferences when user changes
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      fetch(`${process.env.REACT_APP_API_URL}/api/notifications/preferences/${user.user_id}`)
        .then(res => res.json())
        .then(data => setNotificationPreferences(data))
        .catch(err => console.error("Error fetching preferences:", err));
    }
  }, [setNotificationPreferences]);

  const handleModelSelect = useCallback((selectedModel) => {
    setModel(selectedModel);
  }, [setModel]);

  const handlePriceSubmit = useCallback((e) => {
    e.preventDefault();
    if (!price || isNaN(price)) return;

    fetch(`${process.env.REACT_APP_API_URL}/api/gpus/price-analysis?model=${model}&price=${price}`)
      .then((res) => res.json())
      .then((data) => setAnalysis(data))
      .catch((err) => console.error("Error analyzing price:", err));
  }, [model, price]);

  const handleAddNotification = useCallback(async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      setMessage("Please log in to set notifications.");
      return;
    }

    if (!model || !notificationThreshold || isNaN(notificationThreshold)) {
      setMessage("Please select a GPU model and enter a valid price threshold.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/preferences?userId=${user.user_id}&gpuModel=${model}&priceThreshold=${notificationThreshold}`,
        { 
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          }
        }
      );

      if (response.ok) {
        const newPreference = await response.json();
        setMessage("Notification preference added!");
        setNotificationPreferences(prev => [...prev, newPreference]);
        setNotificationThreshold("");
      } else {
        const errorText = await response.text();
        setMessage(errorText || "Error adding notification preference");
      }
    } catch (err) {
      setMessage("Error adding notification preference");
      console.error(err);
    }
  }, [model, notificationThreshold, setNotificationPreferences]);

  const handleRemoveNotification = useCallback(async (preferenceId) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/preferences/${preferenceId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setMessage("✅ Notification preference removed");
        // Refresh preferences
        const user = JSON.parse(localStorage.getItem("user"));
        const updatedPreferences = await fetch(`${process.env.REACT_APP_API_URL}/api/notifications/preferences/${user.user_id}`).then(res => res.json());
        setNotificationPreferences(updatedPreferences);
      }
    } catch (err) {
      setMessage("Error removing notification preference");
      console.error(err);
    }
  }, [setNotificationPreferences]);

  const handleAddFavorite = useCallback(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");
    
    if (!storedUser || !token) {
      setMessage("Please log in to save favorites.");
      return;
    }
  
    fetch(`${process.env.REACT_APP_API_URL}/api/users/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ user_id: storedUser.user_id, model }),
    })
      .then((res) => {
        if (res.status === 401) {
          setMessage("Your session has expired. Please log in again.");
          return Promise.reject("Unauthorized");
        }
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setMessage("⭐ Favorite added!");
          onFavoriteAdded?.();
        } else {
          setMessage("⚠️ This model is already in your favorites.");
        }
      })
      .catch((err) => {
        if (err === "Unauthorized") {
          // Clear invalid auth data
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        } else {
          setMessage("Error adding favorite");
          console.error(err);
        }
      });
  }, [model, onFavoriteAdded]);
  

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
        <svg className="h-6 w-6 mr-2 text-primary-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Price History & Analysis
      </h2>

      <div className="space-y-6">
        <GPUSelector onSelectModel={handleModelSelect} />

        {model && (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Selected: {model}
              </h3>
              <button
                onClick={handleAddFavorite}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200"
              >
                <span className="mr-2">⭐</span>
                Add to Favorites
              </button>
            </div>

            {/* Notification Preferences Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Alerts</h3>
              
              {/* Add Notification Form */}
              <form onSubmit={handleAddNotification} className="mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
                      Notify me when price drops below:
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        id="threshold"
                        value={notificationThreshold}
                        onChange={(e) => setNotificationThreshold(e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                        placeholder="Enter price"
                        required
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors duration-200"
                      >
                        Set Alert
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {message && (
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.includes("⚠️") ? (
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800">{message}</p>
                  </div>
                </div>
              </div>
            )}

            <PriceHistoryChart model={model} />

            <form onSubmit={handlePriceSubmit} className="flex gap-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter your price (USD)"
                  className="w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors duration-200 flex-shrink-0"
              >
                Analyze
              </button>
            </form>

            {analysis && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Your Price</p>
                  <p className="text-lg font-semibold text-gray-900">${analysis.your_price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Market Average</p>
                  <p className="text-lg font-semibold text-gray-900">${analysis.average_price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="text-lg font-medium text-gray-900">{analysis.price_rating}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Market Comparison</p>
                  <p className="text-lg font-medium text-gray-900">
                    {analysis.percent_vs_market}% {analysis.market_direction} market
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Deal Score</p>
                  <div className="flex items-center">
                    <span 
                      className="text-2xl font-bold mr-2"
                      style={{ color: getScoreColor(analysis.deal_score) }}
                    >
                      {analysis.deal_score}
                    </span>
                    <span className="text-gray-500">/10</span>
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${(analysis.deal_score / 10) * 100}%`,
                        backgroundColor: getScoreColor(analysis.deal_score)
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GPUPriceHistoryViewer;
