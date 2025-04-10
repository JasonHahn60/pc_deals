package com.example.demo.util;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Component;

import java.io.IOException;

import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

@Order(2)
@Component
public class JwtFilter implements Filter {

    private final JwtUtil jwtUtil;

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Get the request origin
        String origin = req.getHeader("Origin");
        
        // Check if the origin is in the allowed list
        if (origin != null) {
            String[] allowedOriginsArray = allowedOrigins.split(",");
            for (String allowedOrigin : allowedOriginsArray) {
                if (origin.trim().equals(allowedOrigin.trim())) {
                    res.setHeader("Access-Control-Allow-Origin", origin);
                    break;
                }
            }
        }

        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        // ✅ Allow preflight OPTIONS request to go through
        if ("OPTIONS".equalsIgnoreCase(req.getMethod())) {
            res.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        // 🔐 Token validation for protected endpoints
        String path = req.getRequestURI();
        String authHeader = req.getHeader("Authorization");

        if (path.startsWith("/api/users/favorites")) {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    jwtUtil.validateToken(token);
                    chain.doFilter(request, response);
                    return;
                } catch (Exception e) {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.getWriter().write("Invalid or expired token");
                    return;
                }
            } else {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.getWriter().write("Missing or invalid token");
                return;
            }
        }

        // Public routes
        chain.doFilter(request, response);
    }

}
