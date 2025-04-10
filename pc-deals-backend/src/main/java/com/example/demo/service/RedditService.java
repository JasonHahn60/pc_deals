package com.example.demo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
//import com.theokanning.openai.service.OpenAiService;

import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.regex.*;
import java.sql.Timestamp;

import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
//import com.theokanning.openai.service.OpenAiService;
import com.example.demo.model.GPU;
import com.example.demo.repository.GPURepository;


@Service
public class RedditService {
    @Value("${openai.api.key}")
    private String openaiApiKey;

    @Value("${reddit.client.id}")
    private String clientId;

    @Value("${reddit.client.secret}")
    private String clientSecret;

    @Value("${reddit.user.agent}")
    private String userAgent;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final List<String> GPU_MODELS = List.of(
        "1050", "1050 Ti", "1050Ti", "1060", "1070", "1070 Ti", "1070Ti", "1080", "1080 Ti", "1080Ti",
        "1650", "1660", "1660 Super", "1660Super", "1660 Ti", "1660Ti",
        "2060", "2060 Super", "2060Super", "2070", "2070 Super", "2070Super", "2080", "2080 Super", "2080Super", "2080 Ti", "2080Ti",
        "3050", "3060", "3060 Ti", "3060Ti", "3070", "3070 Ti", "3070Ti", "3080", "3080 Ti", "3080Ti", "3090", "3090 Ti", "3090Ti",
        "4060", "4060 Ti", "4060Ti", "4070", "4070 Super", "4070Super", "4070 Ti", "4070Ti", "4070 Ti Super", "4070TiSuper", "4070Ti Super",
        "4080", "4080 Super", "4080Super", "4090",
        "5070", "5070 Ti", "5070Ti", "5080", "5090",
        "6600", "6600 XT", "6600XT", "6650 XT", "6650XT", "6700 XT", "6700XT", "6750 XT", "6750XT",
        "6800", "6800 XT", "6800XT", "6900 XT", "6900XT", "6950 XT", "6950XT",
        "7600", "7700 XT", "7700XT", "7800 XT", "7800XT", "7900 GRE","7900GRE", "7900 XT", "7900XT", "7900 XTX", "7900XTX",
        "9070", "9070 XT", "9070XT"
    );

    private static final List<String> SKIP_KEYWORDS = List.of(
        "full build", "full pc",
        "custom build", "gaming pc", "full custom build", "complete pc", "complete gaming pc", "gaming rig", "custom Rig", "Gaming rig", "Gaming Rig",
        "desktop pc", "complete build", "entire pc", "ssf build", "itx build", "built pc", "ssf pc", "itx pc", "atx pc", "custom desktop",
        "custom pc", "gaming laptop", "gaming desktop", "whole setup", "gaming setup", "budget pc", "minisforum",
        "gaming PC", "Gaming PC", "flow x13", "complete rig", "complete gaming",
        "razer blade", "not looking to separate", "not going to separate", "will not separate",
        "won't separate", "wont separate", "as a bundle", "as a combo"
        );

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private GPURepository gpuRepository;

    @Autowired
    private NotificationService notificationService;

    public String getAccessToken() {
        String url = "https://www.reddit.com/api/v1/access_token";

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(clientId, clientSecret);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<String> request = new HttpEntity<>("grant_type=client_credentials", headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

        try {
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(response.getBody());
            return jsonNode.get("access_token").asText();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<GPU> fetchAndSaveGPUListings() {
        List<GPU> savedListings = new ArrayList<>();
        String accessToken = getAccessToken();
        if (accessToken == null) return List.of();
    
        String after = null; // Pagination cursor
        int totalListings = 0;
        int maxListings = 275; // Total number of listings to save
        int batchSize = 1; // Number of Reddit posts to batch per LLM call
    
        while (totalListings < maxListings) {
            String url = "https://oauth.reddit.com/r/hardwareswap/new?limit=100";
            if (after != null) url += "&after=" + after;
    
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.set("User-Agent", userAgent);
    
            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
    
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
    
                List<String> listingTexts = new ArrayList<>();
                List<String> urls = new ArrayList<>();
                List<LocalDateTime> timestamps = new ArrayList<>();
    
                for (JsonNode post : jsonNode.path("data").path("children")) {
                    if (totalListings >= maxListings) break;
    
                    JsonNode postData = post.path("data");
                    String flair = postData.path("link_flair_text").asText("");
                    if (!(flair.equals("SELLING") || flair.equals("CLOSED"))) continue;
    
                    String title = postData.path("title").asText();
                    String description = postData.path("selftext").asText();

                    if ((title + " " + description).length() > 1400) continue;  //skipping long listings (too much noise)

                    String postUrl = postData.path("url").asText();
                    long createdUtc = postData.path("created_utc").asLong();
                    LocalDateTime redditPostedAt = Instant.ofEpochSecond(createdUtc).atZone(ZoneId.systemDefault()).toLocalDateTime();
                    String redditPostId = postData.path("id").asText();  // e.g., "1a2b3c"

                    boolean containsGPU = GPU_MODELS.stream().anyMatch(model -> {
                        Pattern pattern = Pattern.compile("(?i)(^|[^a-zA-Z0-9])" + Pattern.quote(model) + "([^a-zA-Z0-9]|$)");
                        return pattern.matcher(title).find();
                    });
    
                    if (!containsGPU) continue;
                    String matchedKeyword = getMatchingSkipKeyword(title, description);
                    if (matchedKeyword != null) {
                        System.out.println("Skipped: " + title);
                        System.out.println("Matched Keyword: " + matchedKeyword);
                        continue;
                    }

                    String formattedText = "Listing " + (listingTexts.size() + 1) + ":\n" + title + "\n" + description;
                    listingTexts.add(formattedText);
                    urls.add(postUrl);
                    timestamps.add(redditPostedAt);
    
                    if (listingTexts.size() == batchSize || totalListings + listingTexts.size() >= maxListings) {
                        String combinedText = String.join("\n\n", listingTexts);
                        List<Map<String, Object>> results = analyzePostWithOpenAI(combinedText);
                        Thread.sleep(300);
    
                        for (Map<String, Object> entry : results) {
                            if (totalListings >= maxListings) break;
                            
                            // Add proper null checks for price
                            Object priceObj = entry.get("price");
                            if (priceObj == null) {
                                System.out.println("Skipping listing with null price");
                                continue;
                            }
                            
                            int price;
                            try {
                                if (priceObj instanceof Number) {
                                    price = ((Number) priceObj).intValue();
                                } else if (priceObj instanceof String) {
                                    price = Integer.parseInt((String) priceObj);
                                } else {
                                    System.out.println("Skipping listing with invalid price type: " + priceObj.getClass());
                                    continue;
                                }
                            } catch (NumberFormatException e) {
                                System.out.println("Skipping listing with invalid price format: " + priceObj);
                                continue;
                            }
                            
                            if (price <= 0) continue; // Skip listings with no valid price
                            if (!entry.containsKey("listing_id")) continue;

                            String listingId = (String) entry.get("listing_id");
                            if (listingId == null) continue;
                            int index = Integer.parseInt(listingId.replaceAll("[^0-9]", "")) - 1;
    
                            if (index >= 0 && index < urls.size()) {
                                String extractedModel = entry.get("model").toString();
                                String originalTitle = title.toLowerCase().replaceAll("\\s+", ""); // Clean up spacing for matching
                                if (!originalTitle.contains(extractedModel.toLowerCase().replaceAll("\\s+", ""))) {
                                    continue;
                                }

                                String urlForListing = urls.get(index);
                                LocalDateTime timestampForListing = timestamps.get(index);
                                entry.put("url", urlForListing);
                                entry.put("timestamp", timestampForListing.toString());
    
                                GPU savedGpu = saveGPUListing(extractedModel, price, urlForListing, timestampForListing, redditPostId);
                                savedListings.add(savedGpu);
                                System.out.println(totalListings);
                                totalListings++;
    
                                if (totalListings >= maxListings) break;
                            }
                        }
                        listingTexts.clear();
                        urls.clear();
                        timestamps.clear();
                    }
                }
    
                after = jsonNode.path("data").path("after").asText(null);
                //System.out.println("Next page after = " + after + " | Total saved = " + totalListings);
                if (after == null) break;
    
            } catch (Exception e) {
                e.printStackTrace();
                break;
            }
        }
        return savedListings;
    }
    
    private GPU saveGPUListing(String model, Integer price, String url, LocalDateTime postedAt, String redditPostId) {
        GPU gpu = new GPU();
        gpu.setModel(model);
        gpu.setPrice(price);
        gpu.setRedditUrl(url);
        gpu.setRedditPostedAt(postedAt);
        gpu.setRedditPostId(redditPostId);

        GPU savedGpu = gpuRepository.save(gpu);
        notificationService.checkForPriceAlerts(savedGpu);
        System.out.println("Saved to DB: " + model + " | $" + price + " | " + url);
        return savedGpu;
    }

    public List<Map<String, Object>> analyzePostWithOpenAI(String combinedListings) {
        String prompt = """
            You are a system that extracts used GPU model and price pairs from Reddit listings on r/hardwareswap.

            Instructions:
            - Only return discrete desktop graphics cards (GPUs) from NVIDIA (1000–5000 series) or AMD (6000, 7000, 9000 series).
            - There can be multiple GPUs in a single listing, so extract each one separately.
            - Exclude CPUs, motherboards, PSUs, RAM, bundles with other parts, and especially laptops, full PCs, custom pc, custom gaming pc, gaming pc, or accessories.
            - Ignore numbers like "6800" or "4080" if they appear in the context of memory speeds, storage speeds, or other specs (e.g., "6800 MB/s", "4080 MT/s"). Use context to ensure you're only extracting GPU models being sold as standalone graphics cards.
            - Exclude unreasonable prices
            - Skip listings where the GPU is untested, broken, for parts, or missing key components.
            - Skip GPU waterblocks.
            - Ignore trade-only listings. If there is no clear asking price, exclude it.
            - Include sold listings with a known selling price.
            - If both local and shipped prices are given, return the **shipped** price.
            - Match each GPU with its correct price using context.
            - Standardize GPU names like this:
            - Include only the model (e.g., "3080 Ti", "6800 XT", "4090")
            - If a GPU name includes extra brand text (e.g., "5070 Gaming Trio", "5070 Windforce"), extract the model number only (e.g., "5070").
            - Use a space between numbers and suffixes like "Ti", "XT", "Super"
            - Do not include prefixes in the model like "RTX", "RX", or any brand names.
            - Round all prices to the nearest dollar and return as integers (no dollar sign).

            Valid GPU Models (only extract these) case and space insensitive:
                1050, 1050 Ti, 1060, 1070, 1070 Ti, 1080, 1080 Ti,
                1650, 1660, 1660 Super, 1660 Ti,
                2060, 2060 Super, 2070, 2070 Super, 2080, 2080 Super, 2080 Ti,
                3050, 3060, 3060 Ti, 3070, 3070 Ti, 3080, 3080 Ti, 3090, 3090 Ti,
                4060, 4060 Ti, 4070, 4070 Super, 4070 Ti, 4070 Ti Super,
                4080, 4080 Super, 4090,
                5070, 5070 Ti, 5080, 5090,
                6600, 6600 XT, 6650 XT, 6700 XT, 6750 XT,
                6800, 6800 XT, 6900 XT, 6950 XT,
                7600, 7700 XT, 7800 XT, 7900 GRE, 7900 XT, 7900 XTX,
                9070, 9070 XT

            Format:
            Return a JSON array only. For each GPU, include:
            - model (e.g. "3080 Ti")
            - price (integer)
            - listing_id (e.g. "Listing 1", "Listing 2", etc.) to match it back to the Reddit listing it came from

            Example output:
            [
                { "model": "3080 Ti", "price": 750, "listing_id": "Listing 1" },
                { "model": "6800 XT", "price": 620, "listing_id": "Listing 2" }
            ]

            Reddit Listing:
            """ + combinedListings;


        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);
    
            Map<String, Object> requestBody = Map.of(
                "model", "gpt-3.5-turbo",  // or "gpt-4"
                "messages", List.of(
                    Map.of("role", "user", "content", prompt)
                ),
                "temperature", 0.2
            );
    
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                "https://api.openai.com/v1/chat/completions",
                HttpMethod.POST,
                request,
                String.class
            );
    
            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(response.getBody());
            String rawJson = json
                .path("choices").path(0)
                .path("message").path("content").asText();
    
            return mapper.readValue(rawJson, new TypeReference<>() {});
        } catch (Exception e) {
            e.printStackTrace();
            return List.of();
        }
    }

    public String getMatchingSkipKeyword(String title, String description) {
        String combinedText = (title + " " + description).toLowerCase();
        for (String keyword : SKIP_KEYWORDS) {
            if (combinedText.contains(keyword.toLowerCase())) {
                return keyword;
            }
        }
        return null;
    }

    public boolean redditPostExists(String redditPostId) {
        String sql = "SELECT COUNT(*) FROM gpu_prices WHERE reddit_post_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, redditPostId);
        return count != null && count > 0;
    }

    public List<GPU> fetchAndSaveNewListings() {
        List<GPU> savedListings = new ArrayList<>();
        String accessToken = getAccessToken();
        if (accessToken == null) return List.of();
    
        String after = null;
    
        while (true) {
            String url = "https://oauth.reddit.com/r/hardwareswap/new?limit=100";
            if (after != null) url += "&after=" + after;
    
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + accessToken);
            headers.set("User-Agent", userAgent);
    
            HttpEntity<String> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
    
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
    
                List<String> listingTexts = new ArrayList<>();
                List<String> urls = new ArrayList<>();
                List<LocalDateTime> timestamps = new ArrayList<>();
                List<String> redditPostIds = new ArrayList<>();
    
                for (JsonNode post : jsonNode.path("data").path("children")) {
                    JsonNode postData = post.path("data");
                    String flair = postData.path("link_flair_text").asText("");
                    if (!flair.equalsIgnoreCase("SELLING") && !flair.equalsIgnoreCase("CLOSED")) continue;
    
                    String title = postData.path("title").asText();
                    String description = postData.path("selftext").asText();
    
                    if ((title + " " + description).length() > 1400) continue;
    
                    String postUrl = postData.path("url").asText();
                    long createdUtc = postData.path("created_utc").asLong();
                    LocalDateTime redditPostedAt = Instant.ofEpochSecond(createdUtc).atZone(ZoneId.systemDefault()).toLocalDateTime();
                    String redditPostId = postData.path("id").asText();
    
                    // Check if this post already exists
                    if (gpuRepository.existsByRedditPostId(redditPostId)) {
                        System.out.println("Found existing post, stopping: " + redditPostId);
                        return savedListings;
                    }
    
                    boolean containsGPU = GPU_MODELS.stream().anyMatch(model -> {
                        Pattern pattern = Pattern.compile("(?i)(?<!\\d)" + Pattern.quote(model) + "(?!\\d)");
                        return pattern.matcher(title).find();
                    });
    
                    if (!containsGPU) continue;
                    String matchedKeyword = getMatchingSkipKeyword(title, description);
                    if (matchedKeyword != null) {
                        System.out.println("Skipped: " + title);
                        System.out.println("Matched Keyword: " + matchedKeyword);
                        continue;
                    }
    
                    String formattedText = title + "\n\n" + description;
                    listingTexts.add(formattedText);
                    urls.add(postUrl);
                    timestamps.add(redditPostedAt);
                    redditPostIds.add(redditPostId);
    
                    if (!listingTexts.isEmpty()) {
                        String combinedText = String.join("\n\n", listingTexts);
                        List<Map<String, Object>> results = analyzePostWithOpenAI(combinedText);
                        Thread.sleep(300);
    
                        for (Map<String, Object> entry : results) {
                            // Add proper null checks for price
                            Object priceObj = entry.get("price");
                            if (priceObj == null) {
                                System.out.println("Skipping listing with null price");
                                continue;
                            }
                            
                            int price;
                            try {
                                if (priceObj instanceof Number) {
                                    price = ((Number) priceObj).intValue();
                                } else if (priceObj instanceof String) {
                                    price = Integer.parseInt((String) priceObj);
                                } else {
                                    System.out.println("Skipping listing with invalid price type: " + priceObj.getClass());
                                    continue;
                                }
                            } catch (NumberFormatException e) {
                                System.out.println("Skipping listing with invalid price format: " + priceObj);
                                continue;
                            }
                            
                            if (price <= 0) continue;
                            if (!entry.containsKey("listing_id")) continue;
    
                            String extractedModel = entry.get("model").toString();
                            // New: Check if it's a known GPU model
                            if (GPU_MODELS.stream().noneMatch(validModel ->
                                validModel.equalsIgnoreCase(extractedModel.trim()))) {
                                System.out.println("Rejected non-GPU model: " + extractedModel);
                                continue;
                            }

                            String normalizedModel = extractedModel.toLowerCase().replaceAll("\\s+", "");
                            String normalizedTitle = title.toLowerCase().replaceAll("\\s+", "");

                            if (!normalizedTitle.contains(normalizedModel)) {
                                System.out.println("Skipping " + extractedModel + " because it was not in the title:\n" + title);
                                continue;
                            }

                            entry.put("url", urls.get(0));
                            entry.put("timestamp", timestamps.get(0).toString());
    
                            GPU savedGpu = saveGPUListing(extractedModel, price, urls.get(0), timestamps.get(0), redditPostIds.get(0));
                            savedListings.add(savedGpu);
                        }
    
                        listingTexts.clear();
                        urls.clear();
                        timestamps.clear();
                        redditPostIds.clear();
                    }
                }
    
                after = jsonNode.path("data").path("after").asText(null);
                if (after == null) break;
    
            } catch (Exception e) {
                e.printStackTrace();
                break;
            }
        }
    
        return savedListings;
    }
}
