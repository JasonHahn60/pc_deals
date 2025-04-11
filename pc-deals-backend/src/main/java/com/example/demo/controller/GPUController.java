package com.example.demo.controller;

import com.example.demo.service.GPUService;
import com.example.demo.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gpus")
public class GPUController {

    @Autowired
    private GPUService gpuService;

    @Autowired
    private JwtUtil jwtUtil;

    //GET ALL OR SPECIFIC MODEL (listings?model=3080)
    @GetMapping("/listings")
    public List<Map<String, Object>> getListings(@RequestParam(required = false) String model) {
        if (model != null && !model.isEmpty()) {
            return gpuService.getListingsByModel(model);
        } else {
            return gpuService.getAllSavedListings();
        }
    }
    
    //GET ALL AVERAGE PRICES OR FOR SPECIFIC MODEL (market-prices?model=3080)
    @GetMapping("/market-prices")
    public Object getMarketPrices(@RequestParam(required = false) String model) {
        if (model != null && !model.isEmpty()) {
            return gpuService.getMarketPrice(model);  // Returns Map<String, Object>
        } else {
            return gpuService.getAllMarketPrices();   // Returns List<Map<String, Object>>
        }
    }

    //GET PRICE HISTORY FOR SPECIFIC MODEL
    @GetMapping("/price-history")
    public List<Map<String, Object>> getPriceHistory(@RequestParam String model) {
        return gpuService.getPriceHistory(model);
    }

    //GET PRICE ANALYSIS FOR SPECIFIC MODEL AND PRICE
    @GetMapping("/price-analysis")
    public Map<String, Object> analyzePrice(@RequestParam String model, @RequestParam int price) {
        return gpuService.analyzePrice(model, price);
    }

    //GET OUTLIERS ABOVE/BELOW THRESHOLD
    @GetMapping("/outliers")
    public ResponseEntity<?> getOutliers(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.validateToken(token.replace("Bearer ", ""));
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            return ResponseEntity.ok(gpuService.getOutliers(email));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    //DELETE OUTLIERS
    @DeleteMapping("/delete-outliers")
    public ResponseEntity<?> deleteOutliers(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.validateToken(token.replace("Bearer ", ""));
            if (email == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");
            }
            gpuService.deleteOutliers(email);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @GetMapping("/market-snapshot")
    public ResponseEntity<Map<String, Object>> getMarketSnapshot() {
        try {
            Map<String, Object> snapshot = gpuService.getMarketSnapshot();
            return ResponseEntity.ok(snapshot);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("error", "Failed to generate market snapshot")
            );
        }
    }
}
