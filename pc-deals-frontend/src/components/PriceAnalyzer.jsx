import React, { useState } from "react";
//not this one
const PriceAnalyzer = ({ model }) => {
  const [price, setPrice] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/gpus/price-analysis?model=${model}&price=${price}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analysis");
      }

      const result = await response.json();
      console.log("Analysis result:", result);
      setAnalysis(result);
    } catch (err) {
      setError("Error fetching price analysis.");
      console.error(err);
    }
  };

  return (
    <div>
      <h3>Analyze Price for {model}</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Price:
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </label>
        <button type="submit">Analyze</button>
      </form>

      {analysis && (
        <div style={{ marginTop: "20px", background: "#f9f9f9", padding: "15px", borderRadius: "8px" }}>
          <h4>Result</h4>
          <p><strong>Market Avg:</strong> ${analysis.average_price}</p>
          <p><strong>Your Price:</strong> ${analysis.your_price}</p>
          <p><strong>Status:</strong> {analysis.price_rating}</p>
          <p><strong>Difference:</strong> {analysis.percent_below_market}% below market</p>
          <p><strong>Deal Score:</strong> {analysis.deal_score}/10</p>
        </div>
      )}


      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default PriceAnalyzer;
