package com.musicreview.service;

import com.musicreview.dto.guessbandonline.*;
import com.musicreview.entity.*;
import com.musicreview.entity.enums.GuessBandRoomStatus;
import com.musicreview.entity.enums.QuestionBankVisibility;
import com.musicreview.repository.*;
import com.musicreview.repository.projection.PlayerGuessCountProjection;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuessBandOnlineService {

    private static final int DEFAULT_MAX_ATTEMPTS = 10;
    private static final int DEFAULT_TOTAL_ROUNDS = 1;
    private static final int DEFAULT_ROUND_TIME_LIMIT_SECONDS = 180;
    private static final int MAX_PLAYERS = 2;

    private final GuessBandOnlineRoomRepository roomRepository;
    private final GuessBandOnlinePlayerRepository playerRepository;
    private final GuessBandOnlineGuessRepository guessRepository;
    private final GuessBandOnlineMatchRecordRepository matchRecordRepository;
    private final QuestionBankRepository questionBankRepository;
    private final ArtistRepository artistRepository;
    private final AuthService authService;

    @Transactional
    public GuessBandOnlineJoinResponse createRoom(GuessBandOnlineCreateRoomRequest request) {
        String displayName = normalizeDisplayName(request.getDisplayName());
        int maxAttempts = request.getMaxAttempts() == null ? DEFAULT_MAX_ATTEMPTS : request.getMaxAttempts();
        int totalRounds = request.getTotalRounds() == null ? DEFAULT_TOTAL_ROUNDS : request.getTotalRounds();
        boolean timedMode = Boolean.TRUE.equals(request.getTimedMode());
        Integer roundTimeLimitSeconds = timedMode
                ? (request.getRoundTimeLimitSeconds() == null ? DEFAULT_ROUND_TIME_LIMIT_SECONDS : request.getRoundTimeLimitSeconds())
                : null;

        User ownerUser = getCurrentUserOrNull();
        QuestionBank selectedBank = resolveQuestionBankForCreate(request.getQuestionBankId(), ownerUser);

        String roomCode = generateUniqueRoomCode();
        String inviteToken = generateToken();
        String ownerPlayerToken = generateToken();

        GuessBandOnlineRoom room = GuessBandOnlineRoom.builder()
                .roomCode(roomCode)
                .inviteToken(inviteToken)
                .status(GuessBandRoomStatus.WAITING)
                .questionBank(selectedBank)
                .candidateArtistIds(serializeArtistIds(loadCandidateArtists(selectedBank)))
                .ownerUser(ownerUser)
                .ownerPlayerToken(ownerPlayerToken)
                .maxAttempts(maxAttempts)
                .totalRounds(totalRounds)
                .currentRound(0)
                .timedMode(timedMode)
                .roundTimeLimitSeconds(roundTimeLimitSeconds)
                .build();

        GuessBandOnlineRoom savedRoom = roomRepository.save(room);

        GuessBandOnlinePlayer ownerPlayer = GuessBandOnlinePlayer.builder()
                .room(savedRoom)
                .playerToken(ownerPlayerToken)
                .user(ownerUser)
                .displayName(displayName)
                .seatIndex(1)
                .ready(true)
                .score(0)
                .lastSeenAt(LocalDateTime.now())
                .build();
        playerRepository.save(ownerPlayer);

        GuessBandOnlineRoomResponse roomResponse = buildRoomResponse(savedRoom, ownerPlayerToken);
        return GuessBandOnlineJoinResponse.builder()
                .playerToken(ownerPlayerToken)
                .room(roomResponse)
                .build();
    }

    @Transactional
    public GuessBandOnlineJoinResponse joinRoom(GuessBandOnlineJoinRoomRequest request) {
        String displayName = normalizeDisplayName(request.getDisplayName());
        GuessBandOnlineRoom room = resolveRoomByCodeOrToken(request.getRoomCodeOrToken());

        if (room.getStatus() == GuessBandRoomStatus.FINISHED) {
            throw new RuntimeException("Room already finished");
        }

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        if (players.size() >= MAX_PLAYERS) {
            throw new RuntimeException("Room is full");
        }

        int nextSeat = players.stream()
                .map(GuessBandOnlinePlayer::getSeatIndex)
                .max(Integer::compareTo)
                .orElse(0) + 1;

        String playerToken = generateToken();
        User user = getCurrentUserOrNull();

        GuessBandOnlinePlayer player = GuessBandOnlinePlayer.builder()
                .room(room)
                .playerToken(playerToken)
                .user(user)
                .displayName(displayName)
                .seatIndex(nextSeat)
                .ready(true)
                .score(0)
                .lastSeenAt(LocalDateTime.now())
                .build();
        playerRepository.save(player);

        List<GuessBandOnlinePlayer> updatedPlayers = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        if (room.getStatus() == GuessBandRoomStatus.WAITING && updatedPlayers.size() == MAX_PLAYERS) {
            startRoomInternal(room, updatedPlayers);
        }

        GuessBandOnlineRoomResponse roomResponse = buildRoomResponse(room, playerToken);
        return GuessBandOnlineJoinResponse.builder()
                .playerToken(playerToken)
                .room(roomResponse)
                .build();
    }

    @Transactional
    public GuessBandOnlineRoomResponse startRoom(String roomCode, GuessBandOnlineStartRequest request) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        GuessBandOnlinePlayer caller = requirePlayer(room, request.getPlayerToken());

        if (!Objects.equals(room.getOwnerPlayerToken(), caller.getPlayerToken())) {
            throw new RuntimeException("Only host can start this room");
        }
        if (room.getStatus() != GuessBandRoomStatus.WAITING) {
            throw new RuntimeException("Room is not in waiting state");
        }

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        if (players.size() != MAX_PLAYERS) {
            throw new RuntimeException("Room needs 2 players to start");
        }

        startRoomInternal(room, players);
        return buildRoomResponse(room, request.getPlayerToken());
    }

    @Transactional
    public GuessBandOnlineRoomResponse nextRound(String roomCode, GuessBandOnlineStartRequest request) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        requirePlayer(room, request.getPlayerToken());

        if (room.getStatus() != GuessBandRoomStatus.IN_PROGRESS) {
            throw new RuntimeException("Room is not in progress");
        }
        if (!isAwaitingNextRound(room)) {
            throw new RuntimeException("Current round is not ready for next round");
        }

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        int currentRound = room.getCurrentRound() == null ? 0 : room.getCurrentRound();
        int totalRounds = room.getTotalRounds() == null ? DEFAULT_TOTAL_ROUNDS : room.getTotalRounds();
        if (currentRound >= totalRounds) {
            finishRoom(room, players, determineWinnerDisplayName(players));
            return buildRoomResponse(room, request.getPlayerToken());
        }

        List<Artist> candidates = loadRoomCandidates(room);
        if (candidates.isEmpty()) {
            finishRoom(room, players, determineWinnerDisplayName(players));
            return buildRoomResponse(room, request.getPlayerToken());
        }

        startRound(room, currentRound + 1, candidates);
        return buildRoomResponse(room, request.getPlayerToken());
    }

    @Transactional
    public GuessBandOnlineRoomResponse rematch(String roomCode, GuessBandOnlineStartRequest request) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        requirePlayer(room, request.getPlayerToken());
        if (room.getStatus() != GuessBandRoomStatus.FINISHED) {
            throw new RuntimeException("Room is not finished yet");
        }

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        if (players.size() != MAX_PLAYERS) {
            throw new RuntimeException("Room needs 2 players to rematch");
        }

        guessRepository.deleteByRoomId(room.getId());
        startRoomInternal(room, players);
        return buildRoomResponse(room, request.getPlayerToken());
    }

    @Transactional
    public GuessBandOnlineRoomResponse getRoomState(String roomCode, String playerToken) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        requirePlayer(room, playerToken);
        maybeAdvanceRoundOnTimeout(room);
        return buildRoomResponse(room, playerToken);
    }

    @Transactional
    public GuessBandOnlineRoomResponse submitGuess(String roomCode, GuessBandOnlineGuessRequest request) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        maybeAdvanceRoundOnTimeout(room);

        if (room.getStatus() != GuessBandRoomStatus.IN_PROGRESS) {
            throw new RuntimeException("Room is not in progress");
        }
        if (room.getTargetArtist() == null || room.getCurrentRound() == null || room.getCurrentRound() < 1) {
            throw new RuntimeException("Target artist is not ready");
        }
        if (isAwaitingNextRound(room)) {
            throw new RuntimeException("Round already ended, click next round");
        }

        GuessBandOnlinePlayer player = requirePlayer(room, request.getPlayerToken());
        player.setLastSeenAt(LocalDateTime.now());

        int usedAttempts = guessRepository.countByRoomIdAndPlayerIdAndRoundIndex(room.getId(), player.getId(), room.getCurrentRound());
        if (usedAttempts >= room.getMaxAttempts()) {
            throw new RuntimeException("No attempts left for this round");
        }

        Artist guessedArtist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        boolean alreadyGuessedThisRound = guessRepository.existsByRoomIdAndRoundIndexAndGuessedArtistId(
                room.getId(),
                room.getCurrentRound(),
                guessedArtist.getId()
        );
        if (alreadyGuessedThisRound) {
            throw new RuntimeException("This band has already been guessed in this round");
        }

        boolean correct = Objects.equals(guessedArtist.getId(), room.getTargetArtist().getId());

        GuessBandOnlineGuess guess = GuessBandOnlineGuess.builder()
                .room(room)
                .player(player)
                .guessedArtist(guessedArtist)
                .targetArtist(room.getTargetArtist())
                .roundIndex(room.getCurrentRound())
                .correct(correct)
                .build();
        guessRepository.save(guess);

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        if (correct) {
            player.setScore((player.getScore() == null ? 0 : player.getScore()) + 1);
            playerRepository.save(player);
            resolveRoundOrFinish(room, players);
        } else {
            maybeResolveIfAllAttemptsUsedCurrentRound(room, players);
        }

        return buildRoomResponse(room, request.getPlayerToken());
    }

    @Transactional(readOnly = true)
    public List<GuessBandOnlineMatchRecordResponse> getRecentMatchRecords() {
        return matchRecordRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(GuessBandOnlineMatchRecordResponse::fromEntity)
                .collect(Collectors.toList());
    }

    private GuessBandOnlineRoom resolveRoomByCodeOrToken(String roomCodeOrToken) {
        String raw = roomCodeOrToken == null ? "" : roomCodeOrToken.trim();
        if (raw.isEmpty()) {
            throw new RuntimeException("Room code or invite token is required");
        }

        String inviteToken = extractInviteToken(raw);
        if (inviteToken != null) {
            return roomRepository.findByInviteToken(inviteToken)
                    .orElseThrow(() -> new RuntimeException("Room not found"));
        }

        String roomCode = raw.toUpperCase(Locale.ROOT);
        return roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private GuessBandOnlineRoom findRoomByCode(String roomCode) {
        return roomRepository.findByRoomCode(roomCode.toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private GuessBandOnlinePlayer requirePlayer(GuessBandOnlineRoom room, String playerToken) {
        GuessBandOnlinePlayer player = playerRepository.findByRoomIdAndPlayerToken(room.getId(), playerToken)
                .orElseThrow(() -> new RuntimeException("Invalid player token"));
        player.setLastSeenAt(LocalDateTime.now());
        playerRepository.save(player);
        return player;
    }

    private String extractInviteToken(String input) {
        if (input.startsWith("http://") || input.startsWith("https://")) {
            try {
                URI uri = URI.create(input);
                String query = uri.getQuery();
                if (query == null || query.isBlank()) {
                    return null;
                }
                for (String kv : query.split("&")) {
                    String[] pair = kv.split("=", 2);
                    if (pair.length == 2 && "t".equalsIgnoreCase(pair[0]) && !pair[1].isBlank()) {
                        return pair[1].trim();
                    }
                }
                return null;
            } catch (Exception e) {
                throw new RuntimeException("Invalid invite link");
            }
        }

        String normalized = input.trim();
        if (normalized.length() > 10) {
            return normalized;
        }
        return null;
    }

    private QuestionBank resolveQuestionBankForCreate(Long questionBankId, User ownerUser) {
        if (questionBankId == null) {
            return null;
        }

        if (ownerUser != null) {
            Optional<QuestionBank> mine = questionBankRepository.findByIdAndOwnerUserId(questionBankId, ownerUser.getId());
            if (mine.isPresent()) {
                return mine.get();
            }
        }

        QuestionBank bank = questionBankRepository.findById(questionBankId)
                .orElseThrow(() -> new RuntimeException("Question bank not found"));
        if (bank.getVisibility() != QuestionBankVisibility.PUBLIC) {
            throw new RuntimeException("Question bank is private");
        }
        return bank;
    }

    private List<Artist> loadCandidateArtists(QuestionBank questionBank) {
        if (questionBank != null) {
            return artistRepository.findPlayableArtistsByQuestionBankId(questionBank.getId());
        }

        return artistRepository.findPlayableArtists();
    }

    private List<Artist> loadRoomCandidates(GuessBandOnlineRoom room) {
        List<Long> snapshotIds = parseArtistIds(room.getCandidateArtistIds());
        if (!snapshotIds.isEmpty()) {
            Map<Long, Artist> artistMap = artistRepository.findAllById(snapshotIds).stream()
                    .filter(this::isPlayableArtist)
                    .collect(Collectors.toMap(Artist::getId, a -> a, (left, right) -> left, LinkedHashMap::new));

            List<Artist> snapshotArtists = new ArrayList<>();
            for (Long artistId : snapshotIds) {
                Artist artist = artistMap.get(artistId);
                if (artist != null) {
                    snapshotArtists.add(artist);
                }
            }
            if (!snapshotArtists.isEmpty()) {
                return snapshotArtists;
            }
        }

        List<Artist> fallback = loadCandidateArtists(room.getQuestionBank());
        if (!fallback.isEmpty()) {
            room.setCandidateArtistIds(serializeArtistIds(fallback));
            roomRepository.save(room);
        }
        return fallback;
    }

    private boolean isPlayableArtist(Artist artist) {
        return artist.getName() != null
                && artist.getCountry() != null
                && artist.getFormedYear() != null
                && artist.getGenre() != null
                && artist.getMemberCount() != null
                && artist.getStatus() != null;
    }

    private void maybeResolveIfAllAttemptsUsedCurrentRound(GuessBandOnlineRoom room, List<GuessBandOnlinePlayer> players) {
        Integer currentRound = room.getCurrentRound();
        if (currentRound == null || currentRound < 1) {
            return;
        }

        Map<Long, Integer> usedCountByPlayer = groupedCountByPlayer(room.getId(), currentRound);
        boolean allUsed = players.stream()
                .allMatch(player -> usedCountByPlayer.getOrDefault(player.getId(), 0) >= room.getMaxAttempts());

        if (allUsed) {
            resolveRoundOrFinish(room, players);
        }
    }

    private void maybeAdvanceRoundOnTimeout(GuessBandOnlineRoom room) {
        if (room.getStatus() != GuessBandRoomStatus.IN_PROGRESS) {
            return;
        }
        if (!Boolean.TRUE.equals(room.getTimedMode())) {
            return;
        }
        if (room.getRoundStartedAt() == null || room.getRoundTimeLimitSeconds() == null) {
            return;
        }

        LocalDateTime deadline = room.getRoundStartedAt().plusSeconds(room.getRoundTimeLimitSeconds());
        if (LocalDateTime.now().isBefore(deadline)) {
            return;
        }

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        resolveRoundOrFinish(room, players);
    }

    private void resolveRoundOrFinish(GuessBandOnlineRoom room, List<GuessBandOnlinePlayer> players) {
        int currentRound = room.getCurrentRound() == null ? 0 : room.getCurrentRound();
        int totalRounds = room.getTotalRounds() == null ? DEFAULT_TOTAL_ROUNDS : room.getTotalRounds();

        if (currentRound >= totalRounds) {
            finishRoom(room, players, determineWinnerDisplayName(players));
            return;
        }
        room.setRoundStartedAt(null);
        roomRepository.save(room);
    }

    private void startRound(GuessBandOnlineRoom room, int roundIndex, List<Artist> candidates) {
        if (candidates.isEmpty()) {
            throw new RuntimeException("No playable artists in selected question bank");
        }

        Artist targetArtist = pickTargetArtist(room, candidates);
        room.setCurrentRound(roundIndex);
        room.setTargetArtist(targetArtist);
        room.setRoundStartedAt(LocalDateTime.now());
        roomRepository.save(room);
    }

    private Artist pickTargetArtist(GuessBandOnlineRoom room, List<Artist> candidates) {
        Artist previousTarget = room.getTargetArtist();
        List<Artist> selectable = candidates;
        if (previousTarget != null && candidates.size() > 1) {
            selectable = candidates.stream()
                    .filter(artist -> !Objects.equals(artist.getId(), previousTarget.getId()))
                    .collect(Collectors.toList());
        }

        return selectable.get(ThreadLocalRandom.current().nextInt(selectable.size()));
    }

    private String determineWinnerDisplayName(List<GuessBandOnlinePlayer> players) {
        if (players == null || players.isEmpty()) {
            return null;
        }

        int maxScore = players.stream()
                .map(GuessBandOnlinePlayer::getScore)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        List<GuessBandOnlinePlayer> topPlayers = players.stream()
                .filter(player -> Objects.equals(player.getScore(), maxScore))
                .collect(Collectors.toList());

        if (topPlayers.size() != 1) {
            return null;
        }
        return topPlayers.get(0).getDisplayName();
    }

    private void finishRoom(GuessBandOnlineRoom room, List<GuessBandOnlinePlayer> players, String winnerDisplayName) {
        if (room.getStatus() == GuessBandRoomStatus.FINISHED) {
            return;
        }

        List<GuessBandOnlinePlayer> safePlayers = players == null
                ? playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId())
                : players;

        room.setStatus(GuessBandRoomStatus.FINISHED);
        room.setFinishedAt(LocalDateTime.now());
        room.setRoundStartedAt(null);
        roomRepository.save(room);

        int totalGuesses = guessRepository.countByRoomId(room.getId());

        String hostDisplayName = safePlayers.stream()
                .filter(player -> Objects.equals(player.getPlayerToken(), room.getOwnerPlayerToken()))
                .map(GuessBandOnlinePlayer::getDisplayName)
                .findFirst()
                .orElse("Host");

        String guestDisplayName = safePlayers.stream()
                .filter(player -> !Objects.equals(player.getPlayerToken(), room.getOwnerPlayerToken()))
                .map(GuessBandOnlinePlayer::getDisplayName)
                .findFirst()
                .orElse("Guest");

        GuessBandOnlineMatchRecord record = GuessBandOnlineMatchRecord.builder()
                .roomCode(room.getRoomCode())
                .questionBank(room.getQuestionBank())
                .hostDisplayName(hostDisplayName)
                .guestDisplayName(guestDisplayName)
                .winnerDisplayName(winnerDisplayName)
                .totalGuesses(totalGuesses)
                .startedAt(room.getStartedAt())
                .finishedAt(room.getFinishedAt())
                .build();
        matchRecordRepository.save(record);
    }

    private GuessBandOnlineRoomResponse buildRoomResponse(GuessBandOnlineRoom room, String playerToken) {
        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        Map<Long, Integer> guessCountByPlayer = room.getStatus() == GuessBandRoomStatus.IN_PROGRESS
                && room.getCurrentRound() != null
                && room.getCurrentRound() > 0
                ? groupedCountByPlayer(room.getId(), room.getCurrentRound())
                : groupedCountByPlayer(room.getId(), null);
        Integer currentRound = room.getCurrentRound();

        List<GuessBandOnlineGuess> guesses = guessRepository.findTop80ByRoomIdOrderByCreatedAtDesc(room.getId());
        Collections.reverse(guesses);

        boolean awaitingNextRound = isAwaitingNextRound(room);
        GuessBandOnlineRoundAnswerResponse roundAnswer = shouldExposeRoundAnswer(room)
                ? GuessBandOnlineRoundAnswerResponse.fromArtist(room.getTargetArtist())
                : null;

        return GuessBandOnlineRoomResponse.builder()
                .roomCode(room.getRoomCode())
                .inviteToken(Objects.equals(room.getOwnerPlayerToken(), playerToken) ? room.getInviteToken() : null)
                .status(room.getStatus())
                .maxAttempts(room.getMaxAttempts())
                .totalRounds(room.getTotalRounds())
                .currentRound(room.getCurrentRound())
                .timedMode(room.getTimedMode())
                .roundTimeLimitSeconds(room.getRoundTimeLimitSeconds())
                .roundStartedAt(room.getRoundStartedAt())
                .roundStartedAtEpochMillis(toEpochMillis(room.getRoundStartedAt()))
                .questionBankId(room.getQuestionBank() != null ? room.getQuestionBank().getId() : null)
                .questionBankName(room.getQuestionBank() != null ? room.getQuestionBank().getName() : "默认题库")
                .startedAt(room.getStartedAt())
                .finishedAt(room.getFinishedAt())
                .winnerDisplayName(room.getStatus() == GuessBandRoomStatus.FINISHED ? determineWinnerDisplayName(players) : null)
                .awaitingNextRound(awaitingNextRound)
                .roundAnswer(roundAnswer)
                .players(players.stream()
                        .map(player -> GuessBandOnlineRoomPlayerResponse.fromEntity(
                                player,
                                guessCountByPlayer.getOrDefault(player.getId(), 0),
                                Objects.equals(player.getPlayerToken(), room.getOwnerPlayerToken())
                        ))
                        .collect(Collectors.toList()))
                .guesses(guesses.stream()
                        .map(GuessBandOnlineRoomGuessResponse::fromEntity)
                        .collect(Collectors.toList()))
                .build();
    }

    private Long toEpochMillis(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private void startRoomInternal(GuessBandOnlineRoom room, List<GuessBandOnlinePlayer> players) {
        List<Artist> candidates = loadRoomCandidates(room);
        if (candidates.isEmpty()) {
            throw new RuntimeException("No playable artists in selected question bank");
        }

        room.setStatus(GuessBandRoomStatus.IN_PROGRESS);
        room.setStartedAt(LocalDateTime.now());
        room.setFinishedAt(null);
        room.setCurrentRound(0);
        room.setTargetArtist(null);
        room.setRoundStartedAt(null);
        roomRepository.save(room);

        for (GuessBandOnlinePlayer player : players) {
            player.setReady(true);
            player.setScore(0);
            player.setLastSeenAt(LocalDateTime.now());
        }
        playerRepository.saveAll(players);

        startRound(room, 1, candidates);
    }

    private String serializeArtistIds(List<Artist> artists) {
        if (artists == null || artists.isEmpty()) {
            return null;
        }
        LinkedHashSet<Long> ids = artists.stream()
                .map(Artist::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (ids.isEmpty()) {
            return null;
        }
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }

    private List<Long> parseArtistIds(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        for (String part : csv.split(",")) {
            String raw = part.trim();
            if (raw.isEmpty()) {
                continue;
            }
            try {
                ids.add(Long.parseLong(raw));
            } catch (NumberFormatException ignored) {
                // Skip invalid token and keep parsing remaining IDs.
            }
        }
        return new ArrayList<>(ids);
    }

    private boolean isAwaitingNextRound(GuessBandOnlineRoom room) {
        return room.getStatus() == GuessBandRoomStatus.IN_PROGRESS
                && room.getCurrentRound() != null
                && room.getCurrentRound() > 0
                && room.getTargetArtist() != null
                && room.getRoundStartedAt() == null;
    }

    private boolean shouldExposeRoundAnswer(GuessBandOnlineRoom room) {
        if (room.getTargetArtist() == null) {
            return false;
        }
        if (room.getStatus() == GuessBandRoomStatus.FINISHED) {
            return true;
        }
        return isAwaitingNextRound(room);
    }

    private Map<Long, Integer> groupedCountByPlayer(Long roomId, Integer roundIndex) {
        List<PlayerGuessCountProjection> rows = roundIndex == null
                ? guessRepository.countByRoomIdGroupByPlayer(roomId)
                : guessRepository.countByRoomIdAndRoundGroupByPlayer(roomId, roundIndex);
        Map<Long, Integer> result = new HashMap<>();
        for (PlayerGuessCountProjection row : rows) {
            result.put(row.getPlayerId(), (int) row.getGuessCount());
        }
        return result;
    }

    private String normalizeDisplayName(String displayName) {
        if (displayName == null) {
            throw new RuntimeException("Display name is required");
        }
        String normalized = displayName.trim();
        if (normalized.isEmpty()) {
            throw new RuntimeException("Display name is required");
        }
        if (normalized.length() > 80) {
            normalized = normalized.substring(0, 80);
        }
        return normalized;
    }

    private String generateUniqueRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (int i = 0; i < 10; i++) {
            StringBuilder code = new StringBuilder();
            for (int j = 0; j < 6; j++) {
                int idx = ThreadLocalRandom.current().nextInt(chars.length());
                code.append(chars.charAt(idx));
            }
            String result = code.toString();
            if (roomRepository.findByRoomCode(result).isEmpty()) {
                return result;
            }
        }
        throw new RuntimeException("Failed to generate room code");
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private User getCurrentUserOrNull() {
        try {
            return authService.getCurrentUser();
        } catch (RuntimeException e) {
            return null;
        }
    }
}
