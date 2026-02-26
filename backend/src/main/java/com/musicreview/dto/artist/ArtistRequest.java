package com.musicreview.dto.artist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
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

    @Size(max = 80, message = "Genre must be less than 80 characters")
    private String genre;

    @Positive(message = "Member count must be positive")
    private Integer memberCount;

    @Pattern(regexp = "活跃|解散", message = "Status must be 活跃 or 解散")
    private String status;

    private String description;

    private String photoUrl;
}
