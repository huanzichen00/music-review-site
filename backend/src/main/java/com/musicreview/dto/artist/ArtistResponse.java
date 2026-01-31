package com.musicreview.dto.artist;

import com.musicreview.entity.Artist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistResponse {

    private Long id;
    private String name;
    private String nameInitial;
    private String country;
    private Integer formedYear;
    private String description;
    private String photoUrl;
    private LocalDateTime createdAt;
    private Integer albumCount;

    public static ArtistResponse fromEntity(Artist artist) {
        // Safely handle lazy-loaded albums collection
        int albumCount = 0;
        try {
            if (artist.getAlbums() != null) {
                albumCount = artist.getAlbums().size();
            }
        } catch (Exception e) {
            // Lazy loading exception - ignore and set to 0
            albumCount = 0;
        }
        
        return ArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .nameInitial(artist.getNameInitial())
                .country(artist.getCountry())
                .formedYear(artist.getFormedYear())
                .description(artist.getDescription())
                .photoUrl(artist.getPhotoUrl())
                .createdAt(artist.getCreatedAt())
                .albumCount(albumCount)
                .build();
    }
}
