package com.example.demo.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Bucket4j;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig implements WebMvcConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitConfig.class);
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
                String ip = request.getRemoteAddr();
                String path = request.getRequestURI();
                String method = request.getMethod();

                logger.info("Rate limit check - IP: {}, Path: {}, Method: {}", ip, path, method);

                // Different rate limits for different endpoints
                Bucket bucket = buckets.computeIfAbsent(ip, key -> {
                    // Authentication endpoints - very strict limits
                    if (path.startsWith("/api/users/login") || path.startsWith("/api/users/register")) {
                        logger.info("Creating auth bucket for IP: {}", ip);
                        return Bucket4j.builder()
                            .addLimit(Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1))))
                            .build();
                    }
                    // User action endpoints - moderate limits
                    else if (path.startsWith("/api/users/favorites") || 
                            path.startsWith("/api/notifications/preferences") ||
                            path.startsWith("/api/users/logout")) {
                        logger.info("Creating user action bucket for IP: {}", ip);
                        return Bucket4j.builder()
                            .addLimit(Bandwidth.classic(20, Refill.intervally(20, Duration.ofMinutes(1))))
                            .build();
                    }
                    // Market data endpoints - higher limits
                    else if (path.startsWith("/api/gpus/market-prices") || 
                            path.startsWith("/api/gpus/price-history") ||
                            path.startsWith("/api/gpus/price-analysis")) {
                        logger.info("Creating market data bucket for IP: {}", ip);
                        return Bucket4j.builder()
                            .addLimit(Bandwidth.classic(60, Refill.intervally(60, Duration.ofMinutes(1))))
                            .build();
                    }
                    // General listings and search - moderate limits
                    else if (path.startsWith("/api/gpus/listings") || 
                            path.startsWith("/api/gpus/search")) {
                        logger.info("Creating listings bucket for IP: {}", ip);
                        return Bucket4j.builder()
                            .addLimit(Bandwidth.classic(30, Refill.intervally(30, Duration.ofMinutes(1))))
                            .build();
                    }
                    // Default for any other endpoints
                    else {
                        logger.info("Creating default bucket for IP: {}", ip);
                        return Bucket4j.builder()
                            .addLimit(Bandwidth.classic(30, Refill.intervally(30, Duration.ofMinutes(1))))
                            .build();
                    }
                });

                if (bucket.tryConsume(1)) {
                    logger.info("Request allowed - IP: {}, Path: {}, Method: {}, Tokens left: {}", 
                        ip, path, method, bucket.getAvailableTokens());
                    return true;
                }

                logger.warn("Rate limit exceeded - IP: {}, Path: {}, Method: {}", ip, path, method);
                response.setStatus(429); // Too Many Requests
                response.getWriter().write("Rate limit exceeded. Please try again later.");
                return false;
            }
        });
    }
} 