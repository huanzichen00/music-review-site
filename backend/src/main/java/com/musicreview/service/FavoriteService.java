package com.musicreview.service;

import com.musicreview.dto.favorite.FavoriteResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.Favorite;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * Get current user's favorites
     */
    public List<FavoriteResponse> getMyFavorites() {
        User currentUser = authService.getCurrentUser();
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(FavoriteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Check if album is favorited by current user
     */
    public boolean isFavorited(Long albumId) {
        User currentUser = authService.getCurrentUser();
        return favoriteRepository.existsByUserIdAndAlbumId(currentUser.getId(), albumId);
    }

    /**
     * Add album to favorites
     */
    @Transactional
    public FavoriteResponse addFavorite(Long albumId) {
        User currentUser = authService.getCurrentUser();

        // Check if already favorited
        if (favoriteRepository.existsByUserIdAndAlbumId(currentUser.getId(), albumId)) {
            throw new RuntimeException("Album is already in favorites");
        }

        // Get album
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + albumId));

        // Create favorite
        Favorite favorite = Favorite.builder()
                .user(currentUser)
                .album(album)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        return FavoriteResponse.fromEntity(saved);
    }

    /**
     * Remove album from favorites
     */
    @Transactional
    public void removeFavorite(Long albumId) {
        User currentUser = authService.getCurrentUser();

        if (!favoriteRepository.existsByUserIdAndAlbumId(currentUser.getId(), albumId)) {
            throw new RuntimeException("Album is not in favorites");
        }

        favoriteRepository.deleteByUserIdAndAlbumId(currentUser.getId(), albumId);
    }

    /**
     * Get favorite count for album
     */
    public long getFavoriteCount(Long albumId) {
        return favoriteRepository.countByAlbumId(albumId);
    }
}
