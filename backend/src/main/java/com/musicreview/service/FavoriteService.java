package com.musicreview.service;

import com.musicreview.dto.favorite.FavoriteResponse;
import com.musicreview.entity.Album;
import com.musicreview.entity.Favorite;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * 获取当前用户的收藏
     */
    public Page<FavoriteResponse> getMyFavorites(Pageable pageable) {
        User currentUser = authService.getCurrentUser();
        return favoriteRepository.findFavoriteResponsesByUserId(currentUser.getId(), pageable);
    }

    /**
     * 检查当前用户是否收藏了该专辑
     */
    public boolean isFavorited(Long albumId) {
        User currentUser = authService.getCurrentUser();
        return favoriteRepository.existsByUserIdAndAlbumId(currentUser.getId(), albumId);
    }

    /**
     * 添加专辑到收藏
     */
    @Transactional
    public FavoriteResponse addFavorite(Long albumId) {
        User currentUser = authService.getCurrentUser();

        // 检查是否已收藏
        if (favoriteRepository.existsByUserIdAndAlbumId(currentUser.getId(), albumId)) {
            throw new RuntimeException("Album is already in favorites");
        }

        // 查询专辑
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + albumId));

        // 创建收藏记录
        Favorite favorite = Favorite.builder()
                .user(currentUser)
                .album(album)
                .build();

        Favorite saved = favoriteRepository.save(favorite);
        return FavoriteResponse.fromEntity(saved);
    }

    /**
     * 取消收藏专辑
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
     * 获取专辑收藏数
     */
    public long getFavoriteCount(Long albumId) {
        return favoriteRepository.countByAlbumId(albumId);
    }
}
