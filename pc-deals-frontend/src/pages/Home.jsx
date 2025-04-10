import React, { useEffect, useState } from "react";
import ListingCard from "../components/ListingCard";
import { fetchListings } from "../services/api";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";

const Home = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchListings();
        setListings(data);
      } catch (err) {
        setError("Failed to load GPU listings. Please try again later.");
        console.error("Error loading listings:", err);
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);

  if (loading) {
    return <LoadingState message="Loading GPU listings..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Used GPU Listings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((item, index) => (
          <ListingCard key={index} listing={item} />
        ))}
      </div>
    </div>
  );
};

export default Home;
