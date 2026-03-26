package com.musicreview.dto.guessbandonline;

import com.musicreview.entity.Artist;
import com.musicreview.entity.GuessBandOnlineGuess;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

@Data
@Builder
public class GuessBandOnlineRoomGuessResponse {

    private static final Map<String, String> CATEGORY_GROUPS = Map.ofEntries(
            Map.entry("uk", "EU"),
            Map.entry("united kingdom", "EU"),
            Map.entry("england", "EU"),
            Map.entry("ireland", "EU"),
            Map.entry("germany", "EU"),
            Map.entry("france", "EU"),
            Map.entry("italy", "EU"),
            Map.entry("sweden", "EU"),
            Map.entry("norway", "EU"),
            Map.entry("finland", "EU"),
            Map.entry("poland", "EU"),
            Map.entry("iceland", "EU"),
            Map.entry("denmark", "EU"),
            Map.entry("netherlands", "EU"),
            Map.entry("belgium", "EU"),
            Map.entry("austria", "EU"),
            Map.entry("switzerland", "EU"),
            Map.entry("portugal", "EU"),
            Map.entry("spain", "EU"),
            Map.entry("greece", "EU"),
            Map.entry("czechia", "EU"),
            Map.entry("czech republic", "EU"),
            Map.entry("hungary", "EU"),
            Map.entry("romania", "EU"),
            Map.entry("us", "NA"),
            Map.entry("usa", "NA"),
            Map.entry("united states", "NA"),
            Map.entry("united states of america", "NA"),
            Map.entry("canada", "NA"),
            Map.entry("australia", "OC"),
            Map.entry("new zealand", "OC"),
            Map.entry("japan", "JP"),
            Map.entry("cn", "CN"),
            Map.entry("china", "CN"),
            Map.entry("中国", "CN"),
            Map.entry("华语", "CN")
    );

    private static final Map<String, String> GENRE_GROUPS = Map.ofEntries(
            Map.entry("Rock", "ROCK"),
            Map.entry("Hard Rock", "ROCK"),
            Map.entry("Progressive Rock", "ROCK"),
            Map.entry("Alternative Rock", "ALT"),
            Map.entry("Indie Rock", "ALT"),
            Map.entry("Funk Rock", "ALT"),
            Map.entry("Britpop", "ALT"),
            Map.entry("Post Punk", "ALT"),
            Map.entry("Nu Metal", "METAL"),
            Map.entry("Industrial Metal", "METAL"),
            Map.entry("Metal", "METAL"),
            Map.entry("Grunge", "ALT"),
            Map.entry("Punk Rock", "PUNK"),
            Map.entry("Pop Punk", "PUNK"),
            Map.entry("Pop Rock", "POP"),
            Map.entry("Indie Pop", "POP"),
            Map.entry("New Wave", "ALT"),
            Map.entry("Folk Rock", "ALT")
    );

    private Long id;
    private Integer roundIndex;
    private String playerDisplayName;
    private Integer playerSeatIndex;
    private String artistName;
    private Boolean correct;
    private String regionValue;
    private String regionState;
    private String genreValue;
    private String genreState;
    private Integer yearValue;
    private String yearState;
    private String yearArrow;
    private Integer membersValue;
    private String membersState;
    private String membersArrow;
    private String statusValue;
    private String statusState;
    private LocalDateTime createdAt;

    public static GuessBandOnlineRoomGuessResponse fromEntity(GuessBandOnlineGuess guess) {
        Artist guessedArtist = guess.getGuessedArtist();
        Artist targetArtist = guess.getTargetArtist();
        Integer targetYear = targetArtist != null ? targetArtist.getFormedYear() : null;
        Integer targetMembers = targetArtist != null ? targetArtist.getMemberCount() : null;
        String targetCountry = targetArtist != null ? targetArtist.getCountry() : null;
        String targetGenre = targetArtist != null ? targetArtist.getGenre() : null;
        String targetStatus = targetArtist != null ? targetArtist.getStatus() : null;
        NumberCompareResult year = compareNumber(guessedArtist.getFormedYear(), targetYear, 5);
        NumberCompareResult members = compareNumber(guessedArtist.getMemberCount(), targetMembers, 1);

        return GuessBandOnlineRoomGuessResponse.builder()
                .id(guess.getId())
                .roundIndex(guess.getRoundIndex())
                .playerDisplayName(guess.getPlayer().getDisplayName())
                .playerSeatIndex(guess.getPlayer().getSeatIndex())
                .artistName(guessedArtist.getName())
                .correct(guess.getCorrect())
                .regionValue(guessedArtist.getCountry())
                .regionState(compareCategory(guessedArtist.getCountry(), targetCountry, CATEGORY_GROUPS))
                .genreValue(guessedArtist.getGenre())
                .genreState(compareCategory(guessedArtist.getGenre(), targetGenre, GENRE_GROUPS))
                .yearValue(guessedArtist.getFormedYear())
                .yearState(year.state())
                .yearArrow(year.arrow())
                .membersValue(guessedArtist.getMemberCount())
                .membersState(members.state())
                .membersArrow(members.arrow())
                .statusValue(guessedArtist.getStatus())
                .statusState(compareCategory(guessedArtist.getStatus(), targetStatus, null))
                .createdAt(guess.getCreatedAt())
                .build();
    }

    private static String compareCategory(String guessValue, String targetValue, Map<String, String> groupMap) {
        String normalizedGuess = normalizeCategoryValue(guessValue);
        String normalizedTarget = normalizeCategoryValue(targetValue);
        if (normalizedGuess.isEmpty() || normalizedTarget.isEmpty()) {
            return "miss";
        }
        if (normalizedGuess.equals(normalizedTarget)) {
            return "exact";
        }
        if (groupMap != null && groupMap.containsKey(normalizedGuess) && groupMap.get(normalizedGuess).equals(groupMap.get(normalizedTarget))) {
            return "close";
        }
        return "miss";
    }

    private static String normalizeCategoryValue(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private static NumberCompareResult compareNumber(Integer guessValue, Integer targetValue, int closeDistance) {
        if (guessValue == null || targetValue == null) {
            return new NumberCompareResult("miss", "");
        }
        if (guessValue.equals(targetValue)) {
            return new NumberCompareResult("exact", "");
        }
        String arrow = guessValue < targetValue ? "↑" : "↓";
        String state = Math.abs(guessValue - targetValue) <= closeDistance ? "close" : "miss";
        return new NumberCompareResult(state, arrow);
    }

    private record NumberCompareResult(String state, String arrow) {
    }
}
