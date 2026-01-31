package com.musicreview.service;

import com.musicreview.dto.genre.GenreResponse;
import com.musicreview.repository.GenreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreService {

    private final GenreRepository genreRepository;

    /**
     * Get all genres
     */
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAllByOrderByNameAsc().stream()
                .map(GenreResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get genre by ID
     */
    public GenreResponse getGenreById(Long id) {
        return genreRepository.findById(id)
                .map(GenreResponse::fromEntity)
                .orElseThrow(() -> new RuntimeException("Genre not found with id: " + id));
    }
}
