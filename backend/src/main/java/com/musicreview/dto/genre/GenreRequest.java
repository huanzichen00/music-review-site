package com.musicreview.dto.genre;

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
public class GenreRequest {

    @NotBlank(message = "Genre name is required")
    @Size(max = 50, message = "Genre name must be less than 50 characters")
    private String name;

    private String description;
}
