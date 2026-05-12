package com.musicreview.service;

import com.musicreview.dto.genre.GenreRequest;
import com.musicreview.dto.genre.GenreResponse;
import com.musicreview.entity.Genre;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.GenreRepository;
import com.musicreview.repository.projection.GenreAlbumCountProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * 获取全部流派
     */
    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        List<Genre> genres = genreRepository.findAllByOrderByNameAsc();
        Map<Long, Integer> albumCountMap = getGenreAlbumCountMap(genres);
        return genres.stream()
                .map(genre -> GenreResponse.fromEntity(genre, albumCountMap.getOrDefault(genre.getId(), 0)))
                .collect(Collectors.toList());
    }

    /**
     * 按 ID 获取流派
     */
    @Transactional(readOnly = true)
    public GenreResponse getGenreById(Long id) {
        return genreRepository.findById(id)
                .map(genre -> GenreResponse.fromEntity(genre, (int) albumRepository.countByGenreId(id)))
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));
    }

    /**
     * 创建流派
     */
    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        // 检查流派是否已存在
        if (genreRepository.existsByName(request.getName())) {
            throw new RuntimeException("Genre already exists: " + request.getName());
        }

        Genre genre = Genre.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();

        Genre saved = genreRepository.save(genre);
        return GenreResponse.fromEntity(saved, 0);
    }

    /**
     * 删除流派（仅用户 "Huan" 可执行，且流派下不能有关联专辑）
     */
    @Transactional
    public void deleteGenre(Long id) {
        User currentUser = authService.getCurrentUser();
        if (!"Huan".equals(currentUser.getUsername())) {
            throw new RuntimeException("Only user 'Huan' can delete genres");
        }

        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));

        int albumCount = (int) albumRepository.countByGenreId(id);
        if (albumCount > 0) {
            throw new RuntimeException("Cannot delete genre: Genre has " + albumCount + " album(s). Please remove genre from albums first.");
        }

        genreRepository.delete(genre);
    }

    private Map<Long, Integer> getGenreAlbumCountMap(List<Genre> genres) {
        Map<Long, Integer> result = new HashMap<>();
        List<Long> genreIds = genres.stream()
                .map(Genre::getId)
                .collect(Collectors.toList());
        if (!genreIds.isEmpty()) {
            for (GenreAlbumCountProjection row : albumRepository.countByGenreIds(genreIds)) {
                result.put(row.getGenreId(), (int) row.getAlbumCount());
            }
        }
        return result;
    }
}
