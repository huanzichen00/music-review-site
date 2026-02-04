package com.musicreview.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private static final String MUSICBRAINZ_BASE = "https://musicbrainz.org/ws/2";
    private static final String USER_AGENT = "MusicReviewSite/1.0 (https://github.com/huanzichen00/music-review-site)";

    /**
     * Search albums from MusicBrainz
     * GET /api/import/search?album=xxx&artist=xxx
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchAlbums(
            @RequestParam(value = "album", required = false) String album,
            @RequestParam(value = "artist", required = false) String artist,
            @RequestParam(value = "limit", defaultValue = "10") int limit
    ) {
        try {
            if ((album == null || album.trim().isEmpty()) && (artist == null || artist.trim().isEmpty())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please provide album name or artist name"));
            }

            // Build search query with exact matching using quotes
            StringBuilder query = new StringBuilder();
            if (album != null && !album.trim().isEmpty()) {
                query.append("release:\"").append(URLEncoder.encode(album.trim(), StandardCharsets.UTF_8)).append("\"");
            }
            if (artist != null && !artist.trim().isEmpty()) {
                if (query.length() > 0) query.append("%20AND%20");
                query.append("artist:\"").append(URLEncoder.encode(artist.trim(), StandardCharsets.UTF_8)).append("\"");
            }

            String url = MUSICBRAINZ_BASE + "/release/?query=" + query + "&fmt=json&limit=" + limit;
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> body = response.getBody();
            if (body == null) {
                return ResponseEntity.ok(Map.of("results", Collections.emptyList()));
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> releases = (List<Map<String, Object>>) body.get("releases");
            if (releases == null || releases.isEmpty()) {
                return ResponseEntity.ok(Map.of("results", Collections.emptyList()));
            }

            // Parse results
            List<Map<String, Object>> results = new ArrayList<>();
            for (Map<String, Object> release : releases) {
                Map<String, Object> result = new HashMap<>();
                result.put("mbid", release.get("id"));
                result.put("title", release.get("title"));
                result.put("trackCount", release.get("track-count"));
                result.put("date", release.get("date"));
                result.put("country", release.get("country"));
                result.put("status", release.get("status"));
                
                // Get artist info
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> artistCredits = (List<Map<String, Object>>) release.get("artist-credit");
                if (artistCredits != null && !artistCredits.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> artistInfo = (Map<String, Object>) artistCredits.get(0).get("artist");
                    if (artistInfo != null) {
                        result.put("artistName", artistInfo.get("name"));
                        result.put("artistMbid", artistInfo.get("id"));
                    }
                }
                
                // Get release group for primary type
                @SuppressWarnings("unchecked")
                Map<String, Object> releaseGroup = (Map<String, Object>) release.get("release-group");
                if (releaseGroup != null) {
                    result.put("type", releaseGroup.get("primary-type"));
                }
                
                results.add(result);
            }

            return ResponseEntity.ok(Map.of("results", results, "count", body.get("count")));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Search failed: " + e.getMessage()));
        }
    }

    /**
     * Get album details and track list from MusicBrainz
     * GET /api/import/album/{mbid}
     */
    @GetMapping("/album/{mbid}")
    public ResponseEntity<?> getAlbumDetails(@PathVariable String mbid) {
        try {
            String url = MUSICBRAINZ_BASE + "/release/" + mbid + "?inc=recordings+artist-credits&fmt=json";
            
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", USER_AGENT);
            headers.set("Accept", "application/json");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> release = response.getBody();
            if (release == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Album not found"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("mbid", release.get("id"));
            result.put("title", release.get("title"));
            result.put("date", release.get("date"));
            result.put("country", release.get("country"));
            result.put("barcode", release.get("barcode"));
            
            // Extract year from date
            String dateStr = (String) release.get("date");
            if (dateStr != null && dateStr.length() >= 4) {
                try {
                    result.put("releaseYear", Integer.parseInt(dateStr.substring(0, 4)));
                } catch (NumberFormatException ignored) {}
            }

            // Get artist info
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> artistCredits = (List<Map<String, Object>>) release.get("artist-credit");
            if (artistCredits != null && !artistCredits.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> artistInfo = (Map<String, Object>) artistCredits.get(0).get("artist");
                if (artistInfo != null) {
                    Map<String, Object> artist = new HashMap<>();
                    artist.put("name", artistInfo.get("name"));
                    artist.put("mbid", artistInfo.get("id"));
                    result.put("artist", artist);
                }
            }

            // Cover art URL not set here to avoid VPN-restricted services in China.

            // Get tracks from all media
            List<Map<String, Object>> tracks = new ArrayList<>();
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> media = (List<Map<String, Object>>) release.get("media");
            if (media != null) {
                int globalTrackNumber = 1;
                for (Map<String, Object> medium : media) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> mediaTracks = (List<Map<String, Object>>) medium.get("tracks");
                    if (mediaTracks != null) {
                        for (Map<String, Object> track : mediaTracks) {
                            Map<String, Object> trackInfo = new HashMap<>();
                            trackInfo.put("trackNumber", globalTrackNumber++);
                            trackInfo.put("title", track.get("title"));
                            
                            // Duration in milliseconds
                            Object length = track.get("length");
                            if (length != null) {
                                int durationMs = ((Number) length).intValue();
                                int durationSeconds = durationMs / 1000;
                                trackInfo.put("duration", durationSeconds);
                                trackInfo.put("minutes", durationSeconds / 60);
                                trackInfo.put("seconds", durationSeconds % 60);
                            }
                            
                            tracks.add(trackInfo);
                        }
                    }
                }
            }
            result.put("tracks", tracks);
            result.put("trackCount", tracks.size());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get album details: " + e.getMessage()));
        }
    }

    /**
     * Import album info from NetEase Cloud Music (may be restricted)
     * GET /api/import/netease?url=xxx
     */
    @GetMapping("/netease")
    public ResponseEntity<?> importFromNetease(@RequestParam("url") String url) {
        try {
            String albumId = extractAlbumId(url);
            if (albumId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid NetEase Music URL"));
            }

            RestTemplate restTemplate = new RestTemplate();
            String apiUrl = "https://music.163.com/api/album/" + albumId;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            headers.set("Referer", "https://music.163.com/");
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> responseEntity = restTemplate.exchange(apiUrl, HttpMethod.GET, entity, Map.class);
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = responseEntity.getBody();
            
            if (response == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Failed to connect to NetEase Music API"));
            }
            
            Object code = response.get("code");
            if (code != null && !Integer.valueOf(200).equals(code)) {
                if (Integer.valueOf(-462).equals(code)) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "NetEase Music API requires login. Please use MusicBrainz search instead."
                    ));
                }
                return ResponseEntity.badRequest().body(Map.of("error", "NetEase error code: " + code));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> album = (Map<String, Object>) response.get("album");
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> songs = (List<Map<String, Object>>) response.get("songs");

            if (album == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Album data not found"));
            }

            Map<String, Object> result = new HashMap<>();
            result.put("title", album.get("name"));
            result.put("coverUrl", album.get("picUrl"));
            result.put("description", album.get("description"));
            
            Object publishTime = album.get("publishTime");
            if (publishTime != null) {
                long timestamp = ((Number) publishTime).longValue();
                Calendar cal = Calendar.getInstance();
                cal.setTimeInMillis(timestamp);
                result.put("releaseYear", cal.get(Calendar.YEAR));
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> artist = (Map<String, Object>) album.get("artist");
            if (artist != null) {
                Map<String, Object> artistInfo = new HashMap<>();
                artistInfo.put("name", artist.get("name"));
                artistInfo.put("photoUrl", artist.get("picUrl"));
                result.put("artist", artistInfo);
            }

            List<Map<String, Object>> tracks = new ArrayList<>();
            if (songs != null) {
                int trackNumber = 1;
                for (Map<String, Object> song : songs) {
                    Map<String, Object> track = new HashMap<>();
                    track.put("trackNumber", trackNumber++);
                    track.put("title", song.get("name"));
                    
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

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to import: " + e.getMessage()));
        }
    }

    private String extractAlbumId(String url) {
        if (url == null || url.trim().isEmpty()) return null;
        url = url.trim();
        if (url.matches("\\d+")) return url;
        
        Pattern[] patterns = {
            Pattern.compile("album[?/]id[=/](\\d+)"),
            Pattern.compile("album/(\\d+)"),
            Pattern.compile("id=(\\d+)")
        };
        
        for (Pattern pattern : patterns) {
            Matcher matcher = pattern.matcher(url);
            if (matcher.find()) return matcher.group(1);
        }
        return null;
    }
}
