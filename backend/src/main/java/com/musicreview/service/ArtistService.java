package com.musicreview.service;

import com.musicreview.dto.artist.ArtistRequest;
import com.musicreview.dto.artist.ArtistResponse;
import com.musicreview.dto.artist.ArtistSearchItemResponse;
import com.musicreview.entity.Artist;
import com.musicreview.entity.Genre;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ArtistRepository;
import com.musicreview.repository.GenreRepository;
import com.musicreview.repository.projection.ArtistAlbumCountProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final GenreRepository genreRepository;
    private final AuthService authService;

    /**
     * Get all artists
     */
    public Page<ArtistResponse> getAllArtists(Pageable pageable) {
        Page<Artist> artists = artistRepository.findAllByOrderByNameAsc(pageable);
        return mapArtistsWithAlbumCount(artists);
    }

    /**
     * Get artists by name initial (A-Z, #)
     */
    public Page<ArtistResponse> getArtistsByInitial(String initial, Pageable pageable) {
        Page<Artist> artists = artistRepository.findByNameInitialOrderByNameAsc(initial.toUpperCase(), pageable);
        return mapArtistsWithAlbumCount(artists);
    }

    /**
     * Get artist by ID
     */
    public ArtistResponse getArtistById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));
        long albumCount = albumRepository.countByArtistId(id);
        return toArtistResponse(artist, (int) albumCount);
    }

    /**
     * Search artists by name
     */
    public Page<ArtistResponse> searchArtists(String query, Pageable pageable) {
        Page<Artist> artists = artistRepository.findByNameContainingIgnoreCase(query, pageable);
        return mapArtistsWithAlbumCount(artists);
    }

    public List<ArtistSearchItemResponse> searchArtistNames(String query, Integer limit) {
        String keyword = query == null ? "" : query.trim();
        if (keyword.isEmpty()) {
            return List.of();
        }
        int safeLimit = limit == null ? 20 : Math.max(1, Math.min(limit, 50));
        return artistRepository.searchLiteByNamePrefix(keyword, PageRequest.of(0, safeLimit));
    }

    /**
     * Create a new artist
     */
    @Transactional
    public ArtistResponse createArtist(ArtistRequest request) {
        String normalizedGenre = normalizeGenre(request.getGenre());
        ensureGenreExists(normalizedGenre);

        Artist artist = Artist.builder()
                .name(request.getName())
                .nameInitial(extractInitial(request.getName()))
                .country(request.getCountry())
                .formedYear(request.getFormedYear())
                .genre(normalizedGenre)
                .memberCount(request.getMemberCount())
                .status(request.getStatus())
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .build();

        Artist saved = artistRepository.save(artist);
        return toArtistResponse(saved, 0);
    }

    /**
     * Update an existing artist
     */
    @Transactional
    public ArtistResponse updateArtist(Long id, ArtistRequest request) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));

        String normalizedGenre = normalizeGenre(request.getGenre());
        ensureGenreExists(normalizedGenre);

        artist.setName(request.getName());
        artist.setNameInitial(extractInitial(request.getName()));
        artist.setCountry(request.getCountry());
        artist.setFormedYear(request.getFormedYear());
        artist.setGenre(normalizedGenre);
        artist.setMemberCount(request.getMemberCount());
        artist.setStatus(request.getStatus());
        artist.setDescription(request.getDescription());
        artist.setPhotoUrl(request.getPhotoUrl());

        Artist saved = artistRepository.save(artist);
        int albumCount = (int) albumRepository.countByArtistId(saved.getId());
        return toArtistResponse(saved, albumCount);
    }

    /**
     * Delete an artist (only allowed for user "Huan" and only if artist has no albums)
     */
    @Transactional
    public void deleteArtist(Long id) {
        // Check permission - only user "Huan" can delete
        User currentUser = authService.getCurrentUser();
        if (!"Huan".equals(currentUser.getUsername())) {
            throw new RuntimeException("Only user 'Huan' can delete artists");
        }
        
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));
        
        // Check if artist has any albums
        long albumCount = albumRepository.countByArtistId(id);
        if (albumCount > 0) {
            throw new RuntimeException("Cannot delete artist: Artist has " + albumCount + " album(s). Please delete all albums first.");
        }
        
        artistRepository.deleteById(id);
    }

    /**
     * Extract initial letter from name (A-Z, or # for non-letters)
     */
    private String extractInitial(String name) {
        if (name == null || name.isEmpty()) {
            return "#";
        }
        char first = Character.toUpperCase(name.charAt(0));
        if (Character.isLetter(first)) {
            return String.valueOf(first);
        }
        return "#";
    }

    private String normalizeGenre(String genre) {
        return genre == null ? null : genre.trim();
    }

    private void ensureGenreExists(String genreName) {
        if (genreName == null || genreName.isEmpty()) {
            return;
        }
        if (genreRepository.findByNameIgnoreCase(genreName).isPresent()) {
            return;
        }
        Genre genre = Genre.builder()
                .name(genreName)
                .description("自动同步自 artists.genre")
                .build();
        genreRepository.save(genre);
    }

    private Page<ArtistResponse> mapArtistsWithAlbumCount(Page<Artist> artistsPage) {
        List<Long> artistIds = artistsPage.getContent().stream()
                .map(Artist::getId)
                .collect(Collectors.toList());

        Map<Long, Integer> albumCountMap = new HashMap<>();
        if (!artistIds.isEmpty()) {
            for (ArtistAlbumCountProjection item : albumRepository.countByArtistIds(artistIds)) {
                albumCountMap.put(item.getArtistId(), (int) item.getAlbumCount());
            }
        }

        return artistsPage.map(artist -> toArtistResponse(artist, albumCountMap.getOrDefault(artist.getId(), 0)));
    }

    private ArtistResponse toArtistResponse(Artist artist, int albumCount) {
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .nameInitial(artist.getNameInitial())
                .country(artist.getCountry())
                .formedYear(artist.getFormedYear())
                .genre(artist.getGenre())
                .memberCount(artist.getMemberCount())
                .status(artist.getStatus())
                .description(artist.getDescription())
                .photoUrl(artist.getPhotoUrl())
                .createdAt(artist.getCreatedAt())
                .albumCount(albumCount)
                .build();
    }
}
