import React, { useEffect, useState } from "react";

const MarketSnapshot = () => {
  const [snapshot, setSnapshot] = useState({
    hot_gpus: [],
    best_deals: [],
    avg_score_week: 0,
    avg_score_month: 0,
    score_trend: 'Analyzing market trends...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/api/gpus/market-snapshot`);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        // Ensure data has the expected structure
        setSnapshot({
          hot_gpus: Array.isArray(data.hot_gpus) ? data.hot_gpus : [],
          best_deals: Array.isArray(data.best_deals) ? data.best_deals : [],
          avg_score_week: data.avg_score_week || 0,
          avg_score_month: data.avg_score_month || 0,
          score_trend: data.score_trend || 'No trend data available'
        });
      } catch (err) {
        setError("Failed to load market snapshot. Please ensure the backend server is running.");
        console.error("Market snapshot error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshot();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-DEFAULT"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Most Listed GPUs */}
        <div className="bg-white rounded-lg shadow-soft p-6 hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">Most Listed GPUs</span>
            <span>🔥</span>
          </h3>
          <ul className="space-y-2">
            {snapshot.hot_gpus.map((entry, i) => (
              <li key={i} className="text-gray-700">
                {entry.model} — <span className="font-medium">{entry.listings}</span> listings
              </li>
            ))}
          </ul>
        </div>
  
        {/* Deal Scores */}
        <div className="bg-white rounded-lg shadow-soft p-6 hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">Average Deal Score</span>
            <span>📊</span>
          </h3>
          <div className="space-y-3">
            <p className="text-gray-700">
              Last 7 days: <span className="font-semibold">{snapshot.avg_score_week}</span>
            </p>
            <p className="text-gray-700">
              Last 30 days: <span className="font-semibold">{snapshot.avg_score_month}</span>
            </p>
            <p className="text-gray-700">
              Trend:{" "}
              <span className={`font-semibold ${
                snapshot.score_trend.includes("better") ||
                snapshot.score_trend.includes("Improving")
                  ? "text-green-600"
                  : snapshot.score_trend.includes("steady")
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}>
                {snapshot.score_trend}
              </span>
            </p>
          </div>
        </div>
  
        {/* Best Deals */}
        <div className="bg-white rounded-lg shadow-soft p-6 hover:shadow-lg transition-shadow duration-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">Best Deals This Week</span>
            <span>💸</span>
          </h3>
          <ul className="space-y-3">
            {snapshot.best_deals.map((deal, i) => (
              <li key={i}>
                <a
                  href={deal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-gray-900 hover:text-primary-DEFAULT transition-colors duration-200"
                >
                  {deal.model}
                </a>
                <div className="text-gray-600 text-sm mt-1">
                  ${deal.price} — Score: <span className="font-medium">{deal.deal_score}/10</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarketSnapshot;
