package com.example.demo.service;

import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Transactional
    public User registerUser(String email, String password) {
        // First check if email exists
        String checkSql = "SELECT COUNT(*) FROM users WHERE email = ?";
        int count = jdbcTemplate.queryForObject(checkSql, Integer.class, email);
        if (count > 0) {
            return null; // email already exists
        }

        // The password is already hashed with SHA-256 from the frontend
        // We'll hash it again with BCrypt for additional security
        String hashed = BCrypt.hashpw(password, BCrypt.gensalt());
        String sql = "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, CURRENT_TIMESTAMP(6))";
        jdbcTemplate.update(sql, email, hashed);
        
        // Return the newly created user
        return getUserByEmail(email);
    }

    public User loginUser(String email, String password) {
        User user = getUserByEmail(email);
        if (user != null && BCrypt.checkpw(password, user.getPasswordHash())) {
            return user;
        }
        return null;
    }

    public User getUserByEmail(String email) {
        try {
            String sql = "SELECT * FROM users WHERE email = ?";
            return jdbcTemplate.queryForObject(sql, new Object[]{email}, new UserRowMapper());
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private static class UserRowMapper implements RowMapper<User> {
        @Override
        public User mapRow(ResultSet rs, int rowNum) throws SQLException {
            User user = new User();
            user.setId(rs.getInt("id"));
            user.setEmail(rs.getString("email"));
            user.setPasswordHash(rs.getString("password_hash"));
            user.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            return user;
        }
    }

    public boolean addFavorite(int userId, String model) {
        try {
            // Check if already exists
            String checkSql = "SELECT COUNT(*) FROM user_favorites WHERE user_id = ? AND model = ?";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, userId, model);
            if (count != null && count > 0) {
                return false;  // Already exists
            }
        
            // Add new favorite with explicit created_at
            String insertSql = "INSERT INTO user_favorites (user_id, model, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)";
            jdbcTemplate.update(insertSql, userId, model);
            return true;
        } catch (Exception e) {
            // If table doesn't exist, create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS user_favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE (user_id, model)
                )
            """;
            jdbcTemplate.execute(createTableSql);
            
            // Try adding the favorite again with explicit created_at
            String insertSql = "INSERT INTO user_favorites (user_id, model, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)";
            jdbcTemplate.update(insertSql, userId, model);
            return true;
        }
    }
    
    public boolean removeFavorite(int userId, String model) {
        try {
            String sql = "DELETE FROM user_favorites WHERE user_id = ? AND model = ?";
            return jdbcTemplate.update(sql, userId, model) > 0;
        } catch (Exception e) {
            // If table doesn't exist, create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS user_favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE (user_id, model)
                )
            """;
            jdbcTemplate.execute(createTableSql);
            return false; // No favorites to remove since table was just created
        }
    }
    
    public List<Map<String, Object>> getFavorites(int userId) {
        try {
            String sql = "SELECT model, created_at FROM user_favorites WHERE user_id = ? ORDER BY created_at ASC";
            return jdbcTemplate.queryForList(sql, userId);
        } catch (Exception e) {
            // If table doesn't exist, create it
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS user_favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE (user_id, model)
                )
            """;
            jdbcTemplate.execute(createTableSql);
            return List.of(); // Return empty list since table was just created
        }
    }

    public boolean isUserAdmin(String username) {
        User user = getUserByEmail(username);
        return user != null && user.isAdmin();
    }
}