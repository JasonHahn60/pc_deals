import React, { useState } from "react";

const PriceAlerts = ({ notificationPreferences, setNotificationPreferences }) => {
  const [message, setMessage] = useState("");

  const handleRemoveNotification = async (preferenceId) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/notifications/preferences/${preferenceId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
            "X-PC-Deals-App": "true"
          },
        }
      );

      if (response.ok) {
        setMessage("Alert removed");
        setNotificationPreferences(prev => prev.filter(pref => pref.id !== preferenceId));
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error removing alert");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      setMessage("Error removing alert");
      console.error(err);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-soft p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <svg className="h-5 w-5 mr-2 text-primary-DEFAULT" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Price Alerts
      </h2>

      {message && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{message}</p>
            </div>
          </div>
        </div>
      )}

      {notificationPreferences.length > 0 ? (
        <div className="space-y-3">
          {notificationPreferences.map((pref) => (
            <div key={pref.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
              <div>
                <span className="font-medium">{pref.gpuModel}</span>
                <span className="text-gray-500 ml-2">below ${pref.priceThreshold}</span>
              </div>
              <button
                onClick={() => handleRemoveNotification(pref.id)}
                className="text-red-600 hover:text-red-800 transition-colors duration-200"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No active price alerts. Set alerts in the price history section.</p>
      )}
    </div>
  );
};

export default PriceAlerts; 