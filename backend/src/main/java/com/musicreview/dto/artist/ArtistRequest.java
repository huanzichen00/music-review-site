package com.musicreview.dto.artist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistRequest {

    @NotBlank(message = "Artist name is required")
    @Size(max = 100, message = "Artist name must be less than 100 characters")
    private String name;

    @Size(max = 50, message = "Country must be less than 50 characters")
    private String country;

    private Integer formedYear;

    private String description;

    private String photoUrl;
}
