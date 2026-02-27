package com.musicreview.controller;

import com.musicreview.dto.questionbank.*;
import com.musicreview.service.QuestionBankService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/question-banks")
@RequiredArgsConstructor
public class QuestionBankController {

    private final QuestionBankService questionBankService;

    @GetMapping("/public")
    public ResponseEntity<List<QuestionBankSummaryResponse>> getPublicBanks() {
        return ResponseEntity.ok(questionBankService.getPublicBanks());
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<?> getPublicBankById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(questionBankService.getPublicBankById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/share/{shareToken}")
    public ResponseEntity<?> getPublicBankByShareToken(@PathVariable String shareToken) {
        try {
            return ResponseEntity.ok(questionBankService.getPublicBankByShareToken(shareToken));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/mine")
    public ResponseEntity<?> getMyBanks() {
        try {
            return ResponseEntity.ok(questionBankService.getMyBanks());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBankForCurrentUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(questionBankService.getBankForCurrentUser(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createBank(@Valid @RequestBody QuestionBankCreateRequest request) {
        try {
            return ResponseEntity.ok(questionBankService.createBank(request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBank(@PathVariable Long id, @Valid @RequestBody QuestionBankUpdateRequest request) {
        try {
            return ResponseEntity.ok(questionBankService.updateBank(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBank(@PathVariable Long id) {
        try {
            questionBankService.deleteBank(id);
            return ResponseEntity.ok(Map.of("message", "Question bank deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/items")
    public ResponseEntity<?> updateBankItems(@PathVariable Long id, @Valid @RequestBody QuestionBankItemsUpdateRequest request) {
        try {
            return ResponseEntity.ok(questionBankService.updateItems(id, request));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
