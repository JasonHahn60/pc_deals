import React, { useState } from "react";
import gpuOptions from "../gpuOptions";

const GPUSelector = ({ onSelectModel }) => {
  const [brand, setBrand] = useState("");
  const [series, setSeries] = useState("");
  const [model, setModel] = useState("");

  const handleBrandChange = (e) => {
    setBrand(e.target.value);
    setSeries("");
    setModel("");
  };

  const handleSeriesChange = (e) => {
    setSeries(e.target.value);
    setModel("");
  };

  const handleModelChange = (e) => {
    const selectedModel = e.target.value;
    setModel(selectedModel);
    onSelectModel(selectedModel);
  };

  const getPrefix = (brand, series) => {
    if (brand === "NVIDIA") {
      return parseInt(series) >= 2000 ? "RTX" : "GTX";
    }
    return "RX";
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-soft">
      <div className="flex items-center gap-3">
        <div className="w-36">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Brand
          </label>
          <select
            value={brand}
            onChange={handleBrandChange}
            className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light"
          >
            <option value="">Select Brand</option>
            {Object.keys(gpuOptions).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {brand && (
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Series
            </label>
            <select
              value={series}
              onChange={handleSeriesChange}
              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light"
            >
              <option value="">Select Series</option>
              {Object.keys(gpuOptions[brand]).map((s) => (
                <option key={s} value={s}>
                  {getPrefix(brand, s)} {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {series && (
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={model}
              onChange={handleModelChange}
              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light"
            >
              <option value="">Select Model</option>
              {gpuOptions[brand][series].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Selection Summary */}
      {brand && (
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            {model ? (
              `${brand} ${getPrefix(brand, series)} ${model}`
            ) : (
              series ? `${brand} ${getPrefix(brand, series)} ${series}` : brand
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default GPUSelector;
