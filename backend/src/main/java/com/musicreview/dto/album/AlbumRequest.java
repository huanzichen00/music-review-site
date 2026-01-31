package com.musicreview.dto.album;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumRequest {

    @NotBlank(message = "Album title is required")
    @Size(max = 200, message = "Album title must be less than 200 characters")
    private String title;

    @NotNull(message = "Artist ID is required")
    private Long artistId;

    private Integer releaseYear;

    private String coverUrl;

    private String description;

    private Set<Long> genreIds;

    private List<TrackDTO> tracks;
}
