package com.example.demo.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secretKey;
    
    private static final long EXPIRATION_TIME = 86400000; // 1 day in ms

    private Key getKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(getKey())
                .compact();
    }

    public String validateToken(String token) {
        try {
            return Jwts.parserBuilder()
                       .setSigningKey(getKey())
                       .build()
                       .parseClaimsJws(token)
                       .getBody()
                       .getSubject();
        } catch (JwtException e) {
            return null;
        }
    }
}
