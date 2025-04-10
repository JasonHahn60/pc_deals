package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.service.UserService;
import com.example.demo.util.JwtUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user, BindingResult result) {
        try {
            if (result.hasErrors()) {
                List<String> errors = result.getFieldErrors().stream()
                    .map(FieldError::getDefaultMessage)
                    .collect(Collectors.toList());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Validation failed",
                    "errors", errors
                ));
            }

            User registeredUser = userService.registerUser(user.getEmail(), user.getPassword());
            if (registeredUser != null) {
                String token = jwtUtil.generateToken(user.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User registered successfully",
                    "token", token,
                    "user_id", registeredUser.getId(),
                    "email", registeredUser.getEmail()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email already exists"
                ));
            }
        } catch (Exception e) {
            e.printStackTrace(); // This will log the full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "message", "Registration failed: " + e.getMessage()
                ));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody User user, BindingResult result) {
        if (result.hasErrors()) {
            List<String> errors = result.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Validation failed",
                "errors", errors
            ));
        }

        User loggedInUser = userService.loginUser(user.getEmail(), user.getPassword());
        if (loggedInUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                "success", false,
                "message", "Invalid credentials"
            ));
        }

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Map.of(
            "success", true,
            "token", token,
            "user_id", loggedInUser.getId(),
            "email", loggedInUser.getEmail()
        ));
    }

    // Optional logout (no effect without session/token tracking)
    @PostMapping("/logout")
    public Map<String, Object> logout() {
        return Map.of("success", true, "message", "User logged out");
    }

    @PostMapping("/favorites")
    public Map<String, Object> addFavorite(@RequestBody Map<String, Object> payload) {
        int userId = (int) payload.get("user_id");
        String model = (String) payload.get("model");

        boolean success = userService.addFavorite(userId, model);
        if (success) {
            return Map.of("success", true, "message", "Favorite added");
        } else {
            return Map.of("success", false, "message", "Model already in favorites");
        }
    }

    @DeleteMapping("/favorites")
    public Map<String, Object> removeFavorite(@RequestParam int user_id, @RequestParam String model) {
        boolean success = userService.removeFavorite(user_id, model);
        return Map.of("success", success, "message", success ? "Favorite removed" : "Favorite not found");
    }

    @GetMapping("/favorites")
    public List<Map<String, Object>> getFavorites(@RequestParam int user_id) {
        return userService.getFavorites(user_id);
    }
}