package com.musicreview.service;

import com.musicreview.dto.genre.GenreRequest;
import com.musicreview.dto.genre.GenreResponse;
import com.musicreview.entity.Genre;
import com.musicreview.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;

    /**
     * Get all genres
     */
    @Transactional(readOnly = true)
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAllByOrderByNameAsc().stream()
                .map(genre -> GenreResponse.fromEntity(genre, getAlbumCount(genre)))
                .collect(Collectors.toList());
    }

    /**
     * Get genre by ID
     */
    @Transactional(readOnly = true)
    public GenreResponse getGenreById(Long id) {
        return genreRepository.findById(id)
                .map(genre -> GenreResponse.fromEntity(genre, getAlbumCount(genre)))
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));
    }

    /**
     * Create a new genre
     */
    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        // Check if genre already exists
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

    private int getAlbumCount(Genre genre) {
        if (genre == null || genre.getAlbums() == null) {
            return 0;
        }
        return genre.getAlbums().size();
    }
}
