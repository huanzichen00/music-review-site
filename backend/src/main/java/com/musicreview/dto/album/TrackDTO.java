package com.musicreview.dto.album;

import com.musicreview.entity.Track;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackDTO {

    private Long id;

    @NotNull(message = "Track number is required")
    private Integer trackNumber;

    @NotBlank(message = "Track title is required")
    private String title;

    private Integer duration; // in seconds

    private String formattedDuration; // MM:SS format

    public static TrackDTO fromEntity(Track track) {
        return TrackDTO.builder()
                .id(track.getId())
                .trackNumber(track.getTrackNumber())
                .title(track.getTitle())
                .duration(track.getDuration())
                .formattedDuration(track.getFormattedDuration())
                .build();
    }
}
