package com.musicreview.dto.genre;

import com.musicreview.entity.Genre;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenreResponse {

    private Long id;
    private String name;
    private String description;
    private Integer albumCount;

    public static GenreResponse fromEntity(Genre genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .albumCount(0) // Will be set by service if needed
                .build();
    }
    
    public static GenreResponse fromEntity(Genre genre, int albumCount) {
        return GenreResponse.builder()
                .id(genre.getId())
                .name(genre.getName())
                .description(genre.getDescription())
                .albumCount(albumCount)
                .build();
    }
}
