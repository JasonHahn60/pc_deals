import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Rectangle,
  ComposedChart,
  Cell,
  ReferenceLine
} from "recharts";

const CustomCandlestick = (props) => {
  const {
    x,
    y,
    width,
    height,
    payload,
    index
  } = props;

  if (!payload) return null;

  const {
    low_price,
    high_price,
    open_price,
    close_price,
    avg_price
  } = payload;

  const candleWidth = 8; // Fixed width for better visualization
  const xCenter = x;
  const wickWidth = 1;
  const isPositive = close_price >= open_price;

  // Get the y coordinate in the chart's coordinate system
  const getY = (price) => {
    if (!y) return 0;
    return y(price);
  };

  return (
    <g>
      {/* Wick line */}
      <line
        x1={xCenter}
        y1={getY(high_price)}
        x2={xCenter}
        y2={getY(low_price)}
        stroke="#64748b"
        strokeWidth={wickWidth}
      />
      {/* Candle body */}
      <rect
        x={xCenter - candleWidth / 2}
        y={getY(Math.max(open_price, close_price))}
        width={candleWidth}
        height={Math.abs(getY(close_price) - getY(open_price))}
        fill={isPositive ? "#22c55e" : "#ef4444"}
        stroke={isPositive ? "#15803d" : "#dc2626"}
        strokeWidth={1}
      />
      {/* Average price dot */}
      <circle
        cx={xCenter}
        cy={getY(avg_price)}
        r={2}
        fill="#6366f1"
      />
    </g>
  );
};

const aggregateDataByDay = (data) => {
  const dailyData = data.reduce((acc, entry) => {
    const date = entry.date.split('T')[0]; // Get just the date part
    if (!acc[date]) {
      acc[date] = {
        date,
        low_price: entry.low_price,
        high_price: entry.high_price,
        avg_price: entry.avg_price,
        listings: entry.listings,
        prices: [entry.avg_price],
      };
    } else {
      acc[date].low_price = Math.min(acc[date].low_price, entry.low_price);
      acc[date].high_price = Math.max(acc[date].high_price, entry.high_price);
      acc[date].prices.push(entry.avg_price);
      acc[date].listings = entry.listings;
    }
    return acc;
  }, {});

  // Calculate daily averages and convert to array
  return Object.values(dailyData).map(day => ({
    ...day,
    avg_price: day.prices.reduce((sum, price) => sum + price, 0) / day.prices.length
  })).sort((a, b) => new Date(a.date) - new Date(b.date));
};

const CustomPriceRange = (props) => {
  const {
    x,
    y,
    width,
    payload,
    index,
    data
  } = props;

  if (!payload || !y) return null;

  const {
    low_price,
    high_price,
    avg_price
  } = payload;

  // Calculate if price is trending up or down
  const prevAvg = index > 0 ? data[index - 1]?.avg_price : avg_price;
  const isPositive = avg_price >= prevAvg;

  // Constants for visualization
  const rangeWidth = 2;  // Width of the vertical range line
  const avgWidth = 12;   // Width of the average price marker
  const xCenter = x;

  return (
    <g>
      {/* Vertical line for price range */}
      <line
        x1={xCenter}
        y1={y(high_price)}
        x2={xCenter}
        y2={y(low_price)}
        stroke={isPositive ? "#15803d" : "#dc2626"}
        strokeWidth={rangeWidth}
      />
      {/* Horizontal line for average price */}
      <line
        x1={xCenter - avgWidth / 2}
        y1={y(avg_price)}
        x2={xCenter + avgWidth / 2}
        y2={y(avg_price)}
        stroke={isPositive ? "#22c55e" : "#ef4444"}
        strokeWidth={3}
      />
    </g>
  );
};

const PriceHistoryChart = ({ model }) => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("line");
  const [timeRange, setTimeRange] = useState("all");

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/gpus/price-history?model=${model}`, {
      headers: {
        "X-PC-Deals-App": "true"
      }
    })
      .then((res) => res.json())
      .then((json) => {
        console.log("📊 Raw price history data:", json);
        const aggregatedData = aggregateDataByDay(json);
        console.log("📊 Aggregated price history data:", aggregatedData);
        setData(aggregatedData);
      })
      .catch((err) => console.error("Error fetching price history:", err));
  }, [model]);

  const getFilteredData = (data) => {
    if (timeRange === "all") return data;

    const now = new Date();
    const ranges = {
      "1w": 7,
      "1m": 30,
      "3m": 90,
      "6m": 180,
      "1y": 365
    };

    const daysToSubtract = ranges[timeRange];
    if (!daysToSubtract) return data;

    const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));
    return data.filter(item => new Date(item.date) >= cutoffDate);
  };

  const renderChart = () => {
    // Ensure data is an array and has the required properties
    const validData = Array.isArray(data) ? data.filter(d => 
      d && typeof d.low_price === 'number' && 
      typeof d.high_price === 'number' && 
      typeof d.avg_price === 'number'
    ) : [];

    // Apply time range filter
    const filteredData = getFilteredData(validData);

    if (filteredData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No price data available</p>
        </div>
      );
    }

    const commonProps = {
      data: filteredData,
      margin: { top: 10, right: 30, left: 50, bottom: 20 }
    };

    const commonAxisProps = {
      stroke: "#94a3b8",
      strokeWidth: 1,
      style: { fontSize: "12px" }
    };

    // Calculate yDomain based on price ranges
    const yDomain = [
      Math.floor(Math.min(...filteredData.map(d => d.low_price)) * 0.95),
      Math.ceil(Math.max(...filteredData.map(d => d.high_price)) * 1.05)
    ];

    switch (chartType) {
      case "candlestick":
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
            <XAxis
              {...commonAxisProps}
              dataKey="date"
              height={60}
              tick={{ angle: -45, textAnchor: 'end' }}
            />
            <YAxis
              {...commonAxisProps}
              domain={yDomain}
              width={60}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{data.date}</p>
                      <p className="text-gray-600">High: ${data.high_price}</p>
                      <p className="text-gray-600">Low: ${data.low_price}</p>
                      <p className="text-gray-600">Average: ${data.avg_price}</p>
                      <p className="text-gray-500 text-sm">Listings: {data.listings}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {/* Price range lines */}
            {filteredData.map((entry, index) => (
              <ReferenceLine
                key={`range-${index}`}
                segment={[
                  { x: entry.date, y: entry.low_price },
                  { x: entry.date, y: entry.high_price }
                ]}
                stroke="#475569"
                strokeWidth={3}
              />
            ))}
            {/* Average price markers */}
            <Bar
              dataKey="avg_price"
              name="Average Price"
              shape={(props) => {
                const { x, payload, index } = props;
                const prevData = index > 0 ? filteredData[index - 1] : null;
                const isPositive = !prevData || payload.avg_price >= prevData.avg_price;
                
                return (
                  <g>
                    <rect
                      x={x - 12}
                      y={props.y - 2}
                      width={24}
                      height={4}
                      rx={2}
                      fill={isPositive ? "#22c55e" : "#ef4444"}
                      stroke="white"
                      strokeWidth={1}
                    />
                  </g>
                );
              }}
            />
          </ComposedChart>
        );
      case "bar":
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              {...commonAxisProps}
              height={20}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis 
              {...commonAxisProps}
              width={60}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{data.date}</p>
                      <p className="text-gray-600">Average: ${data.avg_price}</p>
                      <p className="text-gray-600">Range: ${data.low_price} - ${data.high_price}</p>
                      <p className="text-gray-500 text-sm">Listings: {data.listings}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="avg_price"
              name="Average Price"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
      case "area":
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              {...commonAxisProps}
              height={20}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis 
              {...commonAxisProps}
              width={60}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{data.date}</p>
                      <p className="text-gray-600">Average: ${data.avg_price}</p>
                      <p className="text-gray-600">Range: ${data.low_price} - ${data.high_price}</p>
                      <p className="text-gray-500 text-sm">Listings: {data.listings}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="avg_price"
              name="Average Price"
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              {...commonAxisProps}
              height={20}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis 
              {...commonAxisProps}
              width={60}
              tickLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{data.date}</p>
                      <p className="text-gray-600">Average: ${data.avg_price}</p>
                      <p className="text-gray-600">Range: ${data.low_price} - ${data.high_price}</p>
                      <p className="text-gray-500 text-sm">Listings: {data.listings}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="avg_price"
              name="Average Price"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4, fill: "#6366f1" }}
              activeDot={{ r: 6, fill: "#4f46e5" }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Price History for {model}</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Time Range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="1w">1 Week</option>
              <option value="1m">1 Month</option>
              <option value="3m">3 Months</option>
              <option value="6m">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Chart Type:</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="line">Line Chart</option>
              <option value="area">Area Chart</option>
              <option value="candlestick">Candlestick Chart</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg border border-gray-100">
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;