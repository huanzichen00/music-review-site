package com.musicreview.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    /**
     * Import album info from NetEase Cloud Music
     * GET /api/import/netease?url=xxx
     */
    @GetMapping("/netease")
    public ResponseEntity<?> importFromNetease(@RequestParam("url") String url) {
        try {
            // Extract album ID from URL
            String albumId = extractAlbumId(url);
            if (albumId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid NetEase Music URL"));
            }

            // Call NetEase API with proper headers
            RestTemplate restTemplate = new RestTemplate();
            String apiUrl = "https://music.163.com/api/album/" + albumId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Referer", "https://music.163.com/");
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Map> responseEntity = restTemplate.exchange(
                apiUrl, 
                HttpMethod.GET, 
                entity, 
                Map.class
            );
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = responseEntity.getBody();
            
            if (response == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Failed to connect to NetEase Music API"));
            }
            
            Object code = response.get("code");
            if (code != null && !Integer.valueOf(200).equals(code)) {
                // NetEase API returns error codes for various reasons
                if (Integer.valueOf(-462).equals(code)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "NetEase Music API requires login verification. This feature is currently unavailable due to API restrictions."
                    ));
                }
                return ResponseEntity.badRequest().body(Map.of("error", "Failed to fetch album. Error code: " + code));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> album = (Map<String, Object>) response.get("album");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> songs = (List<Map<String, Object>>) response.get("songs");

            if (album == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Album data not found"));
            }

            // Build result
            Map<String, Object> result = new HashMap<>();
            result.put("title", album.get("name"));
            result.put("coverUrl", album.get("picUrl"));
            
            // Get description - handle null
            Object desc = album.get("description");
            result.put("description", desc != null ? desc.toString() : "");
            
            // Get publish time and extract year
            Object publishTime = album.get("publishTime");
            if (publishTime != null) {
                long timestamp = ((Number) publishTime).longValue();
                Calendar cal = Calendar.getInstance();
                cal.setTimeInMillis(timestamp);
                result.put("releaseYear", cal.get(Calendar.YEAR));
            }

            // Get artist info
            @SuppressWarnings("unchecked")
            Map<String, Object> artist = (Map<String, Object>) album.get("artist");
            if (artist != null) {
                Map<String, Object> artistInfo = new HashMap<>();
                artistInfo.put("name", artist.get("name"));
                artistInfo.put("photoUrl", artist.get("picUrl"));
                result.put("artist", artistInfo);
            }

            // Get tracks
            List<Map<String, Object>> tracks = new ArrayList<>();
            if (songs != null && !songs.isEmpty()) {
                int trackNumber = 1;
                for (Map<String, Object> song : songs) {
                    Map<String, Object> track = new HashMap<>();
                    track.put("trackNumber", trackNumber++);
                    track.put("title", song.get("name"));
                    
                    // Duration in milliseconds
                    Object duration = song.get("duration");
                    if (duration != null) {
                        int durationMs = ((Number) duration).intValue();
                        int durationSeconds = durationMs / 1000;
                        track.put("duration", durationSeconds);
                        track.put("minutes", durationSeconds / 60);
                        track.put("seconds", durationSeconds % 60);
                    }
                    
                    tracks.add(track);
                }
            }
            result.put("tracks", tracks);
            result.put("trackCount", tracks.size());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to import: " + e.getMessage()));
        }
    }

    /**
     * Extract album ID from NetEase Music URL
     * Supports:
     * - https://music.163.com/#/album?id=12345
     * - https://music.163.com/album?id=12345
     * - https://music.163.com/album/12345
     * - 12345 (direct ID)
     */
    private String extractAlbumId(String url) {
        if (url == null || url.trim().isEmpty()) {
            return null;
        }
        
        url = url.trim();
        
        // If it's just a number, return it directly
        if (url.matches("\\d+")) {
            return url;
        }
        
        // Try to extract from URL patterns
        Pattern[] patterns = {
            Pattern.compile("album[?/]id[=/](\\d+)"),
            Pattern.compile("album/(\\d+)"),
            Pattern.compile("id=(\\d+)")
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) {
                return matcher.group(1);
            }
        }
        
        return null;
    }
}
