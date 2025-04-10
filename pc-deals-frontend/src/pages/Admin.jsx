import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchOutliers, deleteOutliers, fetchNewListings } from '../services/api';

const Admin = () => {
  const { token } = useAuth();
  const [outliers, setOutliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [threshold, setThreshold] = useState(1.75);

  const handleFetchOutliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchOutliers(threshold, token);
      setOutliers(data);
    } catch (err) {
      setError('Failed to fetch outliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOutliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await deleteOutliers(threshold, token);
      alert(`Deleted ${result.deleted_count} outliers`);
      setOutliers([]);
    } catch (err) {
      setError('Failed to delete outliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNewListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchNewListings(token);
      alert(`Fetched ${result.length} new listings`);
    } catch (err) {
      setError('Failed to fetch new listings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      
      <div className="mb-4">
        <label className="block mb-2">
          Outlier Threshold:
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            step="0.1"
            min="1"
            className="ml-2 p-2 border rounded"
          />
        </label>
      </div>

      <div className="space-x-4 mb-4">
        <button
          onClick={handleFetchOutliers}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Fetch Outliers
        </button>
        <button
          onClick={handleDeleteOutliers}
          disabled={loading || outliers.length === 0}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
        >
          Delete Outliers
        </button>
        <button
          onClick={handleFetchNewListings}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          Fetch New Listings
        </button>
      </div>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {outliers.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Outliers ({outliers.length})</h2>
          <div className="grid grid-cols-1 gap-4">
            {outliers.map((outlier, index) => (
              <div key={index} className="border p-4 rounded">
                <p>Model: {outlier.model}</p>
                <p>Price: ${outlier.price}</p>
                <p>Average Price: ${outlier.average_price}</p>
                <p>Percent of Average: {outlier.percent_of_average}%</p>
                <a
                  href={outlier.reddit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  View Post
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 