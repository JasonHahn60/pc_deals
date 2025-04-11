package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.security.access.AccessDeniedException;

//import java.time.LocalDateTime;
import java.util.ArrayList;
//import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
//import java.util.Objects;
//import java.util.stream.Collectors;

@Service
public class GPUService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserService userService;

    public List<Map<String, Object>> getAllSavedListings() {
        String sql = "SELECT model, price, reddit_url AS url, reddit_posted_at AS timestamp FROM gpu_prices ORDER BY reddit_posted_at DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getListingsByModel(String model) {
        String sql = "SELECT * FROM gpu_prices WHERE model = ? ORDER BY reddit_posted_at DESC";
        return jdbcTemplate.queryForList(sql, model);
    }

    public List<Map<String, Object>> getAllMarketPrices() {
        String sql = "SELECT model, ROUND(AVG(price)) AS avg_price, COUNT(*) AS listings " +
                     "FROM gpu_prices GROUP BY model ORDER BY avg_price DESC";
        return jdbcTemplate.queryForList(sql);
    }
    
    public Map<String, Object> getMarketPrice(String model) {
        String sql = "SELECT model, AVG(price) AS avg_price, COUNT(*) AS count " +
                     "FROM gpu_prices WHERE model = ? GROUP BY model";
        return jdbcTemplate.queryForMap(sql, model);
    }

    public List<Map<String, Object>> getLatestListings() {
        String sql = "SELECT model, price, reddit_url AS url, reddit_posted_at AS timestamp FROM gpu_prices ORDER BY reddit_posted_at DESC";
        return jdbcTemplate.queryForList(sql);
    }

    public List<Map<String, Object>> getPriceHistory(String model) {
        String sql = """
            WITH daily_prices AS (
                SELECT
                    reddit_posted_at::date AS date,
                    MIN(price) AS low_price,
                    MAX(price) AS high_price,
                    AVG(price) AS avg_price,
                    COUNT(*) AS listings,
                    MIN(reddit_posted_at) AS first_timestamp,
                    MAX(reddit_posted_at) AS last_timestamp
                FROM gpu_prices
                WHERE model = ?
                GROUP BY reddit_posted_at::date
            )
            SELECT
                date,
                ROUND(low_price) AS low_price,
                ROUND(high_price) AS high_price,
                ROUND(avg_price) AS avg_price,
                listings,
                (
                    SELECT price 
                    FROM gpu_prices 
                    WHERE reddit_posted_at::date = daily_prices.date 
                    AND reddit_posted_at = daily_prices.first_timestamp 
                    LIMIT 1
                ) AS open_price,
                (
                    SELECT price 
                    FROM gpu_prices 
                    WHERE reddit_posted_at::date = daily_prices.date 
                    AND reddit_posted_at = daily_prices.last_timestamp 
                    LIMIT 1
                ) AS close_price
            FROM daily_prices
            ORDER BY date ASC
            """;
        return jdbcTemplate.queryForList(sql, model);
    }
    
    public Map<String, Object> analyzePrice(String model, int price) {
        String sql = """
            SELECT 
                (SELECT ROUND(AVG(price)) FROM gpu_prices WHERE model = ? AND reddit_posted_at >= NOW() - INTERVAL '7 days') AS avg_price,
                (SELECT STDDEV(price) FROM gpu_prices WHERE model = ? AND reddit_posted_at >= NOW() - INTERVAL '7 days') AS stddev_price,
                (SELECT COUNT(*) FROM gpu_prices WHERE model = ? AND reddit_posted_at >= NOW() - INTERVAL '7 days') AS recent_listings
        """;
    
        Map<String, Object> stats = jdbcTemplate.queryForMap(sql, model, model, model);
    
        if (stats.get("avg_price") == null || stats.get("stddev_price") == null) {
            return Map.of(
                "model", model,
                "your_price", price,
                "message", "Not enough recent market data to analyze this GPU."
            );
        }
    
        int avgPrice = ((Number) stats.get("avg_price")).intValue();
        double stddev = ((Number) stats.get("stddev_price")).doubleValue();
    
        if (stddev == 0.0) {
            return Map.of(
                "model", model,
                "average_price", avgPrice,
                "your_price", price,
                "message", "Market is too stable to determine rating — all listings are priced the same."
            );
        }
    
        double zScore = (price - avgPrice) / stddev;
    
        // Market shift logic
        double trendFactor = ((double)(avgPrice - avgPrice) / avgPrice);
    
        // Adjust z-score based on recent dip/rise
        if (trendFactor < -0.05) {
            zScore -= 0.3; // market dipping → your price is even better
        } else if (trendFactor > 0.05) {
            zScore += 0.3; // market rising → your price is relatively worse
        }
    
        // Rating based on final z-score
        String rating = (zScore <= -2.0) ? "🔥 Great price"
                      : (zScore <= -1.0) ? "✅ Good price"
                      : (zScore <= 0.5)  ? "⚖️ Fair price"
                      : "❌ Overpriced";
        
        double rawDiff = ((double)(avgPrice - price) / avgPrice) * 100;
        double absDiff = Math.round(Math.abs(rawDiff) * 10.0) / 10.0;
        String direction = (price < avgPrice) ? "below" : "above";
                      
        double rawScore = (0 - zScore) / 2.75 * 10;
        int dealScore = (int) Math.max(0, Math.min(10, Math.round(rawScore)));        

        return Map.of(
            "model", model,
            "average_price", avgPrice,
            "your_price", price,
            "price_rating", rating,
            "percent_vs_market", absDiff,
            "market_direction", direction,
            "deal_score", dealScore
        );
    }    

    public List<Map<String, Object>> getPriceOutliers(double threshold) {
        List<String> models = jdbcTemplate.queryForList("SELECT DISTINCT model FROM gpu_prices", String.class);
        List<Map<String, Object>> outliers = new ArrayList<>();

        for (String model : models) {
            Double avgPrice = jdbcTemplate.queryForObject(
                "SELECT AVG(price) FROM gpu_prices WHERE model = ?", Double.class, model);

            if (avgPrice == null || avgPrice == 0) continue;

            double upper = avgPrice * threshold;
            double lower = avgPrice / threshold;

            List<Map<String, Object>> listings = jdbcTemplate.queryForList(
                "SELECT model, price, reddit_post_id, reddit_url, reddit_posted_at FROM gpu_prices " +
                "WHERE model = ? AND (price > ? OR price < ?) ORDER BY reddit_posted_at DESC",
                model, upper, lower
            );

            for (Map<String, Object> listing : listings) {
                Integer price = (Integer) listing.get("price");
                double percentOfAverage = price / avgPrice;

                listing.put("average_price", Math.round(avgPrice));
                listing.put("percent_of_average", Math.round(percentOfAverage * 100.0) / 100.0);

                outliers.add(listing);
            }
        }

        return outliers;
    }

    public int deletePriceOutliers(double threshold) {
        String sql = """
            DELETE FROM gpu_prices
            WHERE price > (
                SELECT * FROM (
                    SELECT AVG(price) * ?
                    FROM gpu_prices AS sub
                    WHERE sub.model = gpu_prices.model
                ) AS high_threshold
            )
            OR price < (
                SELECT * FROM (
                    SELECT AVG(price) / ?
                    FROM gpu_prices AS sub
                    WHERE sub.model = gpu_prices.model
                ) AS low_threshold
            )
            """;
        return jdbcTemplate.update(sql, threshold, threshold);
    }

    private double getAverageZBasedDealScore(String period, java.sql.Timestamp maxDate) {
        String sql = """
            WITH recent_prices AS (
                SELECT 
                    model,
                    price,
                    (
                        SELECT AVG(price)
                        FROM gpu_prices g2
                        WHERE g2.model = gpu_prices.model
                        AND g2.reddit_posted_at >= (
                            SELECT MAX(reddit_posted_at) - INTERVAL '7 days'
                            FROM gpu_prices
                        )
                    ) as avg_price,
                    (
                        SELECT STDDEV(price)
                        FROM gpu_prices g2
                        WHERE g2.model = gpu_prices.model
                        AND g2.reddit_posted_at >= (
                            SELECT MAX(reddit_posted_at) - INTERVAL '7 days'
                            FROM gpu_prices
                        )
                    ) as price_stddev
                FROM gpu_prices
                WHERE reddit_posted_at >= (
                    SELECT MAX(reddit_posted_at) - (INTERVAL '1 day' * ?)
                    FROM gpu_prices
                )
            )
            SELECT AVG(
                GREATEST(0, LEAST(10, (0 - ((price - avg_price) / NULLIF(price_stddev, 0))) / 2.75 * 10))
            ) as avg_score
            FROM recent_prices
            WHERE price_stddev > 0
        """;
        
        Double avgScore = jdbcTemplate.queryForObject(sql, Double.class, period.equals("7 days") ? 7 : 30);
        return avgScore != null ? avgScore : 0.0;
    }

    public Map<String, Object> getMarketSnapshot() {
        Map<String, Object> snapshot = new LinkedHashMap<>();

        try {
            // 1. Hot GPUs: most listed in last 7 days
            String hotGpusSql = """
                SELECT model, COUNT(*) AS listings
                FROM gpu_prices
                WHERE reddit_posted_at >= NOW() - INTERVAL '7 days'
                AND price IS NOT NULL
                GROUP BY model
                HAVING COUNT(*) > 0
                ORDER BY listings DESC
                LIMIT 5
            """;
            List<Map<String, Object>> hotGpus = jdbcTemplate.queryForList(hotGpusSql);
            snapshot.put("hot_gpus", hotGpus);

            // 2. Calculate average scores
            String scoresSql = """
                WITH model_stats AS (
                    SELECT 
                        model,
                        AVG(NULLIF(price, 0)) as avg_price,
                        STDDEV(NULLIF(price, 0)) as stddev_price
                    FROM gpu_prices
                    WHERE reddit_posted_at >= NOW() - INTERVAL '7 days'
                    AND price IS NOT NULL
                    GROUP BY model
                    HAVING STDDEV(NULLIF(price, 0)) > 0
                ),
                recent_scores AS (
                    SELECT 
                        g.model,
                        g.price,
                        ms.avg_price,
                        ms.stddev_price,
                        CASE 
                            WHEN g.reddit_posted_at >= NOW() - INTERVAL '7 days' THEN 'week'
                            ELSE 'month'
                        END as period
                    FROM gpu_prices g
                    JOIN model_stats ms ON g.model = ms.model
                    WHERE g.reddit_posted_at >= NOW() - INTERVAL '7 days'
                    AND g.price IS NOT NULL
                    AND g.price > 0
                )
                SELECT 
                    period,
                    COALESCE(AVG(
                        GREATEST(0, 
                        LEAST(10, 
                            ROUND(
                                (0 - ((price - avg_price) / NULLIF(stddev_price, 0))) / 2.75 * 10
                            )
                        ))
                    ), 0) as avg_score
                FROM recent_scores
                GROUP BY period
            """;
            
            List<Map<String, Object>> scores = jdbcTemplate.queryForList(scoresSql);
            double avgScoreWeek = 0.0;
            double avgScoreMonth = 0.0;
            
            for (Map<String, Object> score : scores) {
                String period = (String) score.get("period");
                Object scoreObj = score.get("avg_score");
                Double avgScore = scoreObj instanceof Number ? ((Number) scoreObj).doubleValue() : 0.0;
                
                if ("week".equals(period)) {
                    avgScoreWeek = avgScore;
                } else {
                    avgScoreMonth = avgScore;
                }
            }

            double roundedWeek = Math.round(avgScoreWeek * 10.0) / 10.0;
            double roundedMonth = Math.round(avgScoreMonth * 10.0) / 10.0;

            String scoreTrend = roundedWeek > roundedMonth
                ? "Deals are better this week ✅"
                : roundedWeek < roundedMonth
                ? "Deals are worse this week ❌"
                : "Deal quality is steady ⚖️";

            snapshot.put("avg_score_week", roundedWeek);
            snapshot.put("avg_score_month", roundedMonth);
            snapshot.put("score_trend", scoreTrend);

            // 3. Best Deals: highest deal scores in last 7 days
            String bestDealsSql = """
                WITH model_stats AS (
                    SELECT 
                        model,
                        AVG(NULLIF(price, 0)) as avg_price,
                        STDDEV(NULLIF(price, 0)) as stddev_price
                    FROM gpu_prices
                    WHERE reddit_posted_at >= NOW() - INTERVAL '7 days'
                    AND price IS NOT NULL
                    GROUP BY model
                    HAVING STDDEV(NULLIF(price, 0)) > 0
                )
                SELECT 
                    g.model,
                    g.price,
                    g.reddit_url as url,
                    GREATEST(0, 
                    LEAST(10, 
                        ROUND(
                            (0 - ((g.price - ms.avg_price) / NULLIF(ms.stddev_price, 0))) / 2.75 * 10
                        )
                    )) as deal_score
                FROM gpu_prices g
                JOIN model_stats ms ON g.model = ms.model
                WHERE g.reddit_posted_at >= NOW() - INTERVAL '7 days'
                AND g.price IS NOT NULL
                AND g.price > 0
                ORDER BY deal_score DESC
                LIMIT 5
            """;
            List<Map<String, Object>> bestDeals = jdbcTemplate.queryForList(bestDealsSql);
            snapshot.put("best_deals", bestDeals);

        } catch (Exception e) {
            e.printStackTrace();
            // Return a valid but empty snapshot on error
            snapshot.put("hot_gpus", new ArrayList<>());
            snapshot.put("avg_score_week", 0.0);
            snapshot.put("avg_score_month", 0.0);
            snapshot.put("score_trend", "Error calculating market trends");
            snapshot.put("best_deals", new ArrayList<>());
        }

        return snapshot;
    }

    public List<Map<String, Object>> getOutliers(String email) {
        if (!userService.isUserAdmin(email)) {
            throw new AccessDeniedException("Only admins can access outliers");
        }
        return getPriceOutliers(1.75);
    }

    public void deleteOutliers(String email) {
        if (!userService.isUserAdmin(email)) {
            throw new AccessDeniedException("Only admins can delete outliers");
        }
        deletePriceOutliers(1.75);
    }
}
