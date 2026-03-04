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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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
    public Page<AlbumResponse> getAllAlbums(Pageable pageable) {
        return albumRepository.findAlbumSummaries(pageable);
    }

    /**
     * Get albums by title initial (A-Z, #)
     */
    public Page<AlbumResponse> getAlbumsByInitial(String initial, Pageable pageable) {
        return albumRepository.findByTitleInitialOrderByTitleAsc(initial.toUpperCase(), pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * Get album by ID with full details
     */
    @Transactional(readOnly = true)
    public AlbumResponse getAlbumById(Long id) {
        Album album = albumRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Album not found with id: " + id));
        return AlbumResponse.fromEntity(album);
    }

    /**
     * Get albums by artist
     */
    public Page<AlbumResponse> getAlbumsByArtist(Long artistId, Pageable pageable) {
        return albumRepository.findByArtistIdOrderByReleaseYearDesc(artistId, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * Get albums by genre
     */
    public Page<AlbumResponse> getAlbumsByGenre(Long genreId, Pageable pageable) {
        return albumRepository.findByGenreId(genreId, pageable)
                .map(AlbumResponse::fromEntitySimple);
    }

    /**
     * Get albums by release year
     */
    public Page<AlbumResponse> getAlbumsByYear(Integer year, Pageable pageable) {
        return albumRepository.findByReleaseYear(year, pageable)
                .map(AlbumResponse::fromEntitySimple);
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
    public Page<AlbumResponse> searchAlbums(String query, Pageable pageable) {
        return albumRepository.findByTitleContainingIgnoreCase(query, pageable)
                .map(AlbumResponse::fromEntitySimple);
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

        // Attach tracks (dedupe by trackNumber + title)
        List<TrackDTO> dedupedTracks = dedupeTracks(request.getTracks());
        if (!dedupedTracks.isEmpty()) {
            for (TrackDTO trackDTO : dedupedTracks) {
                Track track = Track.builder()
                        .album(album)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                album.getTracks().add(track);
            }
        }

        Album savedAlbum = albumRepository.save(album);
        return AlbumResponse.fromEntity(savedAlbum);
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

        // Update tracks (dedupe by trackNumber + title)
        if (request.getTracks() != null) {
            // Hard delete existing rows first to avoid stale ORM state causing duplicated inserts.
            trackRepository.deleteByAlbumId(album.getId());
            album.getTracks().clear();
            List<TrackDTO> dedupedTracks = dedupeTracks(request.getTracks());
            for (TrackDTO trackDTO : dedupedTracks) {
                Track track = Track.builder()
                        .album(album)
                        .trackNumber(trackDTO.getTrackNumber())
                        .title(trackDTO.getTitle())
                        .duration(trackDTO.getDuration())
                        .build();
                album.getTracks().add(track);
            }
        }

        Album savedAlbum = albumRepository.save(album);
        return AlbumResponse.fromEntity(savedAlbum);
    }

    /**
     * Delete an album (only allowed for user "Huan")
     */
    @Transactional
    public void deleteAlbum(Long id) {
        // Check permission - only user "Huan" can delete
        User currentUser = authService.getCurrentUser();
        if (!"Huan".equals(currentUser.getUsername())) {
            throw new RuntimeException("Only user 'Huan' can delete albums");
        }
        
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

    private List<TrackDTO> dedupeTracks(List<TrackDTO> tracks) {
        if (tracks == null || tracks.isEmpty()) {
            return List.of();
        }
        Map<String, TrackDTO> unique = new LinkedHashMap<>();
        for (TrackDTO track : tracks) {
            if (track == null || track.getTitle() == null) {
                continue;
            }
            String title = track.getTitle().trim();
            if (title.isEmpty() || track.getTrackNumber() == null) {
                continue;
            }
            String key = track.getTrackNumber() + "|" + title.toLowerCase();
            unique.putIfAbsent(key, TrackDTO.builder()
                    .trackNumber(track.getTrackNumber())
                    .title(title)
                    .duration(track.getDuration())
                    .build());
        }
        return unique.values().stream().collect(Collectors.toList());
    }
}
