package com.example.demo.controller;

import com.example.demo.service.GPUService;
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
    @GetMapping("/listings/outliers")
    public List<Map<String, Object>> getOutliers(@RequestParam(defaultValue = "1.75") double threshold) {
        return gpuService.getPriceOutliers(threshold);
    }

    //DELETE OUTLIERS
    @GetMapping("/listings/delete-outliers")
    public Map<String, Object> deleteOutliers(@RequestParam(defaultValue = "1.75") double threshold) {
        int deleted = gpuService.deletePriceOutliers(threshold);
        return Map.of(
            "threshold_multiplier", threshold,
            "deleted_count", deleted,
            "message", "Outliers deleted successfully"
        );
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
