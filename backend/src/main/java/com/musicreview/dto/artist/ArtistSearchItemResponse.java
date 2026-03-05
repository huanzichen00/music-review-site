package com.musicreview.dto.artist;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ArtistSearchItemResponse {
    private Long id;
    private String name;
}
