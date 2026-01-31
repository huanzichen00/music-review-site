package com.musicreview.service;

import com.musicreview.dto.album.AlbumRequest;
import com.musicreview.dto.album.AlbumResponse;
import com.musicreview.dto.album.TrackDTO;
import com.musicreview.entity.Album;
import com.musicreview.entity.Artist;
import com.musicreview.entity.Genre;
import com.musicreview.entity.Track;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ArtistRepository;
import com.musicreview.repository.GenreRepository;
import com.musicreview.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final GenreRepository genreRepository;
    private final TrackRepository trackRepository;
    private final AuthService authService;

    /**
     * Get all albums
     */
    public List<AlbumResponse> getAllAlbums() {
        return albumRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Get albums by title initial (A-Z, #)
     */
    public List<AlbumResponse> getAlbumsByInitial(String initial) {
        return albumRepository.findByTitleInitialOrderByTitleAsc(initial.toUpperCase()).stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Get album by ID with full details
     */
    public AlbumResponse getAlbumById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));
        return AlbumResponse.fromEntity(album);
    }

    /**
     * Get albums by artist
     */
    public List<AlbumResponse> getAlbumsByArtist(Long artistId) {
        return albumRepository.findByArtistIdOrderByReleaseYearDesc(artistId).stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Get albums by genre
     */
    public List<AlbumResponse> getAlbumsByGenre(Long genreId) {
        return albumRepository.findByGenreId(genreId).stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Get albums by release year
     */
    public List<AlbumResponse> getAlbumsByYear(Integer year) {
        return albumRepository.findByReleaseYear(year).stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Get all available release years
     */
    public List<Integer> getAllReleaseYears() {
        return albumRepository.findAllReleaseYears();
    }

    /**
     * Search albums by title
     */
    public List<AlbumResponse> searchAlbums(String query) {
        return albumRepository.findByTitleContainingIgnoreCase(query).stream()
                .map(AlbumResponse::fromEntitySimple)
                .collect(Collectors.toList());
    }

    /**
     * Create a new album
     */
    @Transactional
    public AlbumResponse createAlbum(AlbumRequest request) {
        // Get artist
        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + request.getArtistId()));

        // Get current user
        User currentUser = authService.getCurrentUser();

        // Get genres
        Set<Genre> genres = new HashSet<>();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            genres = request.getGenreIds().stream()
                    .map(genreId -> genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId)))
                    .collect(Collectors.toSet());
        }

        // Create album
        Album album = Album.builder()
                .title(request.getTitle())
                .titleInitial(extractInitial(request.getTitle()))
                .artist(artist)
                .releaseYear(request.getReleaseYear())
                .coverUrl(request.getCoverUrl())
                .description(request.getDescription())
                .genres(genres)
                .createdBy(currentUser)
                .build();

        Album savedAlbum = albumRepository.save(album);

        // Save tracks
        if (request.getTracks() != null && !request.getTracks().isEmpty()) {
            for (TrackDTO trackDTO : request.getTracks()) {
                Track track = Track.builder()
                        .album(savedAlbum)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                trackRepository.save(track);
            }
        }

        // Reload album with tracks
        Album reloaded = albumRepository.findById(savedAlbum.getId()).orElse(savedAlbum);
        return AlbumResponse.fromEntity(reloaded);
    }

    /**
     * Update an existing album
     */
    @Transactional
    public AlbumResponse updateAlbum(Long id, AlbumRequest request) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));

        // Get artist
        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + request.getArtistId()));

        // Get genres
        Set<Genre> genres = new HashSet<>();
        if (request.getGenreIds() != null && !request.getGenreIds().isEmpty()) {
            genres = request.getGenreIds().stream()
                    .map(genreId -> genreRepository.findById(genreId)
                            .orElseThrow(() -> new RuntimeException("Genre not found with id: " + genreId)))
                    .collect(Collectors.toSet());
        }

        // Update album
        album.setTitle(request.getTitle());
        album.setTitleInitial(extractInitial(request.getTitle()));
        album.setArtist(artist);
        album.setReleaseYear(request.getReleaseYear());
        album.setCoverUrl(request.getCoverUrl());
        album.setDescription(request.getDescription());
        album.setGenres(genres);

        // Update tracks
        if (request.getTracks() != null) {
            // Remove old tracks
            trackRepository.deleteByAlbumId(id);

            // Add new tracks
            for (TrackDTO trackDTO : request.getTracks()) {
                Track track = Track.builder()
                        .album(album)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                trackRepository.save(track);
            }
        }

        Album savedAlbum = albumRepository.save(album);
        return AlbumResponse.fromEntity(savedAlbum);
    }

    /**
     * Delete an album
     */
    @Transactional
    public void deleteAlbum(Long id) {
        if (!albumRepository.existsById(id)) {
            throw new RuntimeException("Album not found with id: " + id);
        }
        albumRepository.deleteById(id);
    }

    /**
     * Extract initial letter from title (A-Z, or # for non-letters)
     */
    private String extractInitial(String title) {
        if (title == null || title.isEmpty()) {
            return "#";
        }
        char first = Character.toUpperCase(title.charAt(0));
        if (Character.isLetter(first)) {
            return String.valueOf(first);
        }
        return "#";
    }
}
