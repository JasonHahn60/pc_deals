package com.example.demo.util;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

import java.io.IOException;

@Order(1)
@Component
public class AdminFilter implements Filter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        String path = req.getRequestURI();
        
        // Check if the path is an admin endpoint
        if (path.startsWith("/api/gpus/listings/delete-outliers") || 
            path.startsWith("/api/reddit/fetch-save") ||
            path.startsWith("/api/reddit/fetch-save-new") ||
            path.startsWith("/api/gpus/listings/outliers")) {
            
            String authHeader = req.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.getWriter().write("Missing or invalid token");
                return;
            }

            String token = authHeader.substring(7);
            String email;
            try {
                email = jwtUtil.validateToken(token);
                if (email == null) {
                    res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    res.getWriter().write("Invalid or expired token");
                    return;
                }
            } catch (Exception e) {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.getWriter().write("Invalid or expired token");
                return;
            }

            // Check if user is admin
            Boolean isAdmin = jdbcTemplate.queryForObject(
                "SELECT is_admin FROM users WHERE email = ?",
                Boolean.class,
                email
            );

            if (isAdmin == null || !isAdmin) {
                res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                res.getWriter().write("Admin access required");
                return;
            }
        }

        chain.doFilter(request, response);
    }
} 