package com.musicreview.dto.questionbank;

import com.musicreview.entity.Artist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankArtistResponse {

    private Long id;
    private String name;
    private String country;
    private Integer formedYear;
    private String genre;
    private Integer memberCount;
    private String status;

    public static QuestionBankArtistResponse fromEntity(Artist artist) {
        return QuestionBankArtistResponse.builder()
                .id(artist.getId())
                .name(artist.getName())
                .country(artist.getCountry())
                .formedYear(artist.getFormedYear())
                .genre(artist.getGenre())
                .memberCount(artist.getMemberCount())
                .status(artist.getStatus())
                .build();
    }
}
