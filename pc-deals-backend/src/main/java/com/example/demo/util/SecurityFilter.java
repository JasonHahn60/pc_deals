package com.example.demo.util;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.core.annotation.Order;

import java.io.IOException;

@Order(0)
@Component
public class SecurityFilter implements Filter {

    @Value("${cors.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest req = (HttpServletRequest) request;
        HttpServletResponse res = (HttpServletResponse) response;

        // Check if the request is coming from a browser
        String userAgent = req.getHeader("User-Agent");
        String origin = req.getHeader("Origin");
        String referer = req.getHeader("Referer");

        // Allow requests from your frontend
        if (origin != null) {
            String[] allowedOriginsArray = allowedOrigins.split(",");
            for (String allowedOrigin : allowedOriginsArray) {
                if (origin.trim().equals(allowedOrigin.trim())) {
                    chain.doFilter(request, response);
                    return;
                }
            }
        }

        // Block direct API access
        res.setStatus(HttpServletResponse.SC_FORBIDDEN);
        res.getWriter().write("Direct API access is not allowed. Please use the frontend application.");
    }
} 