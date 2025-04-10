import React from "react";

const FavoriteList = ({ favorites, onSelectFavorite, onRemove }) => {
  if (!Array.isArray(favorites) || favorites.length === 0) {
    return <p>No saved favorites yet.</p>;
  }

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>Your Favorites</h3>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "10px"
      }}>
        {favorites.map((fav) => (
          <div
            key={fav.model}
            style={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "6px 12px",
              background: "#f9f9f9"
            }}
          >
            <button
              onClick={() => onSelectFavorite(fav.model)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                marginRight: "10px"
              }}
            >
              ⭐ {fav.model}
            </button>
            <button
              onClick={() => onRemove(fav.model)}
              style={{
                color: "red",
                border: "none",
                background: "none",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoriteList;
