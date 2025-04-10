import React from "react";

const ListingCard = ({ listing }) => {
  return (
    <div className="listing-card">
      <h2>{listing.model}</h2>
      <p>Price: ${listing.price}</p>
      <p>Posted: {new Date(listing.timestamp).toLocaleString()}</p>
      <a
        href={listing.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        View Post
      </a>
    </div>
  );
};

export default ListingCard;
