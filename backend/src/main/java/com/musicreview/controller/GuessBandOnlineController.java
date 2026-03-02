package com.musicreview.controller;

import com.musicreview.dto.guessbandonline.*;
import com.musicreview.service.GuessBandOnlineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/guess-band-online")
@RequiredArgsConstructor
public class GuessBandOnlineController {

    private final GuessBandOnlineService guessBandOnlineService;

    @PostMapping("/rooms")
    public ResponseEntity<?> createRoom(@Valid @RequestBody GuessBandOnlineCreateRoomRequest request) {
        try {
            return ResponseEntity.ok(guessBandOnlineService.createRoom(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/join")
    public ResponseEntity<?> joinRoom(@Valid @RequestBody GuessBandOnlineJoinRoomRequest request) {
        try {
            return ResponseEntity.ok(guessBandOnlineService.joinRoom(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/rooms/{roomCode}")
    public ResponseEntity<?> getRoomState(
            @PathVariable String roomCode,
            @RequestParam String playerToken
    ) {
        try {
            return ResponseEntity.ok(guessBandOnlineService.getRoomState(roomCode, playerToken));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/{roomCode}/start")
    public ResponseEntity<?> startRoom(
            @PathVariable String roomCode,
            @Valid @RequestBody GuessBandOnlineStartRequest request
    ) {
        try {
            return ResponseEntity.ok(guessBandOnlineService.startRoom(roomCode, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/rooms/{roomCode}/guess")
    public ResponseEntity<?> submitGuess(
            @PathVariable String roomCode,
            @Valid @RequestBody GuessBandOnlineGuessRequest request
    ) {
        try {
            return ResponseEntity.ok(guessBandOnlineService.submitGuess(roomCode, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/records")
    public ResponseEntity<?> getRecentRecords() {
        try {
            return ResponseEntity.ok(guessBandOnlineService.getRecentMatchRecords());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
