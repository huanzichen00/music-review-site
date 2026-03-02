package com.musicreview.service;

import com.musicreview.dto.guessbandonline.*;
import com.musicreview.entity.*;
import com.musicreview.entity.enums.GuessBandRoomStatus;
import com.musicreview.entity.enums.QuestionBankVisibility;
import com.musicreview.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GuessBandOnlineService {

    private static final int DEFAULT_MAX_ATTEMPTS = 10;
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
                .ownerUser(ownerUser)
                .ownerPlayerToken(ownerPlayerToken)
                .maxAttempts(maxAttempts)
                .build();

        GuessBandOnlineRoom savedRoom = roomRepository.save(room);

        GuessBandOnlinePlayer ownerPlayer = GuessBandOnlinePlayer.builder()
                .room(savedRoom)
                .playerToken(ownerPlayerToken)
                .user(ownerUser)
                .displayName(displayName)
                .seatIndex(1)
                .ready(true)
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
                .lastSeenAt(LocalDateTime.now())
                .build();
        playerRepository.save(player);

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

        List<Artist> candidates = loadCandidateArtists(room.getQuestionBank());
        if (candidates.isEmpty()) {
            throw new RuntimeException("No playable artists in selected question bank");
        }

        Artist targetArtist = candidates.get(ThreadLocalRandom.current().nextInt(candidates.size()));
        room.setTargetArtist(targetArtist);
        room.setStatus(GuessBandRoomStatus.IN_PROGRESS);
        room.setStartedAt(LocalDateTime.now());
        room.setFinishedAt(null);
        roomRepository.save(room);

        for (GuessBandOnlinePlayer player : players) {
            player.setReady(true);
            player.setLastSeenAt(LocalDateTime.now());
        }
        playerRepository.saveAll(players);

        return buildRoomResponse(room, request.getPlayerToken());
    }

    @Transactional(readOnly = true)
    public GuessBandOnlineRoomResponse getRoomState(String roomCode, String playerToken) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        requirePlayer(room, playerToken);
        return buildRoomResponse(room, playerToken);
    }

    @Transactional
    public GuessBandOnlineRoomResponse submitGuess(String roomCode, GuessBandOnlineGuessRequest request) {
        GuessBandOnlineRoom room = findRoomByCode(roomCode);
        if (room.getStatus() != GuessBandRoomStatus.IN_PROGRESS) {
            throw new RuntimeException("Room is not in progress");
        }
        if (room.getTargetArtist() == null) {
            throw new RuntimeException("Target artist is not ready");
        }

        GuessBandOnlinePlayer player = requirePlayer(room, request.getPlayerToken());
        player.setLastSeenAt(LocalDateTime.now());

        int usedAttempts = guessRepository.countByRoomIdAndPlayerId(room.getId(), player.getId());
        if (usedAttempts >= room.getMaxAttempts()) {
            throw new RuntimeException("No attempts left for this player");
        }

        Artist guessedArtist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        boolean correct = Objects.equals(guessedArtist.getId(), room.getTargetArtist().getId());

        GuessBandOnlineGuess guess = GuessBandOnlineGuess.builder()
                .room(room)
                .player(player)
                .guessedArtist(guessedArtist)
                .correct(correct)
                .build();
        guessRepository.save(guess);

        if (correct) {
            finishRoom(room, player.getDisplayName());
        } else {
            maybeFinishIfAllAttemptsUsed(room);
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
            return questionBank.getItems().stream()
                    .map(QuestionBankItem::getArtist)
                    .filter(this::isPlayableArtist)
                    .collect(Collectors.toList());
        }

        return artistRepository.findAll().stream()
                .filter(this::isPlayableArtist)
                .collect(Collectors.toList());
    }

    private boolean isPlayableArtist(Artist artist) {
        return artist.getName() != null
                && artist.getCountry() != null
                && artist.getFormedYear() != null
                && artist.getGenre() != null
                && artist.getMemberCount() != null
                && artist.getStatus() != null;
    }

    private void maybeFinishIfAllAttemptsUsed(GuessBandOnlineRoom room) {
        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        boolean allUsed = players.stream()
                .allMatch(player -> guessRepository.countByRoomIdAndPlayerId(room.getId(), player.getId()) >= room.getMaxAttempts());

        if (allUsed) {
            finishRoom(room, null);
        }
    }

    private void finishRoom(GuessBandOnlineRoom room, String winnerDisplayName) {
        if (room.getStatus() == GuessBandRoomStatus.FINISHED) {
            return;
        }

        room.setStatus(GuessBandRoomStatus.FINISHED);
        room.setFinishedAt(LocalDateTime.now());
        roomRepository.save(room);

        List<GuessBandOnlinePlayer> players = playerRepository.findByRoomIdOrderBySeatIndexAsc(room.getId());
        int totalGuesses = guessRepository.countByRoomId(room.getId());

        String hostDisplayName = players.stream()
                .filter(player -> Objects.equals(player.getPlayerToken(), room.getOwnerPlayerToken()))
                .map(GuessBandOnlinePlayer::getDisplayName)
                .findFirst()
                .orElse("Host");

        String guestDisplayName = players.stream()
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
        Map<Long, Integer> guessCountByPlayer = new HashMap<>();
        for (GuessBandOnlinePlayer player : players) {
            int count = guessRepository.countByRoomIdAndPlayerId(room.getId(), player.getId());
            guessCountByPlayer.put(player.getId(), count);
        }

        List<GuessBandOnlineGuess> guesses = guessRepository.findByRoomIdOrderByCreatedAtAsc(room.getId());

        String winnerDisplayName = guesses.stream()
                .filter(GuessBandOnlineGuess::getCorrect)
                .map(GuessBandOnlineGuess::getPlayer)
                .map(GuessBandOnlinePlayer::getDisplayName)
                .findFirst()
                .orElse(null);

        return GuessBandOnlineRoomResponse.builder()
                .roomCode(room.getRoomCode())
                .inviteToken(Objects.equals(room.getOwnerPlayerToken(), playerToken) ? room.getInviteToken() : null)
                .status(room.getStatus())
                .maxAttempts(room.getMaxAttempts())
                .questionBankId(room.getQuestionBank() != null ? room.getQuestionBank().getId() : null)
                .questionBankName(room.getQuestionBank() != null ? room.getQuestionBank().getName() : "默认题库")
                .startedAt(room.getStartedAt())
                .finishedAt(room.getFinishedAt())
                .winnerDisplayName(winnerDisplayName)
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
