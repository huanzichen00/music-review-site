package com.musicreview.service;

import com.musicreview.dto.search.HotSearchResponse;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class SearchAnalyticsService {

    private static final String ALBUM_HOT_SEARCH_KEY = "search:album:hot";

    private final StringRedisTemplate redisTemplate;

    public SearchAnalyticsService(ObjectProvider<StringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    public void recordAlbumSearch(String rawKeyword) {
        String keyword = normalizeKeyword(rawKeyword);
        if (keyword == null || redisTemplate == null) {
            return;
        }
        redisTemplate.opsForZSet().incrementScore(ALBUM_HOT_SEARCH_KEY, keyword, 1D);
    }

    public List<HotSearchResponse> getAlbumHotSearches(int limit) {
        if (redisTemplate == null) {
            return List.of();
        }

        Set<ZSetOperations.TypedTuple<String>> tuples =
                redisTemplate.opsForZSet().reverseRangeWithScores(ALBUM_HOT_SEARCH_KEY, 0, limit - 1);

        if (tuples == null) {
            return List.of();
        }

        return tuples.stream()
                .filter(t -> t.getValue() != null && !t.getValue().isBlank())
                .map(t -> new HotSearchResponse(t.getValue(), Math.round(t.getScore())))
                .toList();
    }

    // 标准化处理, 去掉前后、重复的空格, 长度超过 60 截断
    public String normalizeKeyword(String rawKeyword) {
        if (rawKeyword == null) {
            return null;
        }
        String keyword = rawKeyword.trim().replaceAll("\\s+", " ");
        if (keyword.isEmpty()) {
            return null;
        }
        return keyword.length() > 60 ? keyword.substring(0, 60) : keyword;
    }
}
