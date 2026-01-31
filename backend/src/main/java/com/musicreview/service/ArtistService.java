package com.musicreview.service;

import com.musicreview.dto.artist.ArtistRequest;
import com.musicreview.dto.artist.ArtistResponse;
import com.musicreview.entity.Artist;
import com.musicreview.entity.User;
import com.musicreview.repository.AlbumRepository;
import com.musicreview.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final AuthService authService;

    /**
     * Get all artists
     */
    public List<ArtistResponse> getAllArtists() {
        return artistRepository.findAllByOrderByNameAsc().stream()
                .map(ArtistResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get artists by name initial (A-Z, #)
     */
    public List<ArtistResponse> getArtistsByInitial(String initial) {
        return artistRepository.findByNameInitialOrderByNameAsc(initial.toUpperCase()).stream()
                .map(ArtistResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get artist by ID
     */
    public ArtistResponse getArtistById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));
        return ArtistResponse.fromEntity(artist);
    }

    /**
     * Search artists by name
     */
    public List<ArtistResponse> searchArtists(String query) {
        return artistRepository.findByNameContainingIgnoreCase(query).stream()
                .map(ArtistResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Create a new artist
     */
    @Transactional
    public ArtistResponse createArtist(ArtistRequest request) {
        Artist artist = Artist.builder()
                .name(request.getName())
                .nameInitial(extractInitial(request.getName()))
                .country(request.getCountry())
                .formedYear(request.getFormedYear())
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .build();

        Artist saved = artistRepository.save(artist);
        return ArtistResponse.fromEntity(saved);
    }

    /**
     * Update an existing artist
     */
    @Transactional
    public ArtistResponse updateArtist(Long id, ArtistRequest request) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Artist not found with id: " + id));

        artist.setName(request.getName());
        artist.setNameInitial(extractInitial(request.getName()));
        artist.setCountry(request.getCountry());
        artist.setFormedYear(request.getFormedYear());
        artist.setDescription(request.getDescription());
        artist.setPhotoUrl(request.getPhotoUrl());

        Artist saved = artistRepository.save(artist);
        return ArtistResponse.fromEntity(saved);
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
        List<com.musicreview.entity.Album> albums = albumRepository.findByArtistIdOrderByReleaseYearDesc(id);
        if (albums != null && !albums.isEmpty()) {
            throw new RuntimeException("Cannot delete artist: Artist has " + albums.size() + " album(s). Please delete all albums first.");
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
}
