package com.musicreview.service;

import com.musicreview.dto.questionbank.*;
import com.musicreview.entity.Artist;
import com.musicreview.entity.QuestionBank;
import com.musicreview.entity.QuestionBankItem;
import com.musicreview.entity.User;
import com.musicreview.entity.enums.QuestionBankVisibility;
import com.musicreview.repository.ArtistRepository;
import com.musicreview.repository.QuestionBankItemRepository;
import com.musicreview.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuestionBankService {

    private static final int MIN_ITEMS = 10;
    private static final int MAX_ITEMS = 300;

    private final QuestionBankRepository questionBankRepository;
    private final QuestionBankItemRepository questionBankItemRepository;
    private final ArtistRepository artistRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<QuestionBankSummaryResponse> getMyBanks() {
        User currentUser = authService.getCurrentUser();
        return questionBankRepository.findByOwnerUserIdOrderByUpdatedAtDesc(currentUser.getId()).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<QuestionBankSummaryResponse> getPublicBanks() {
        return questionBankRepository.findByVisibilityOrderByUpdatedAtDesc(QuestionBankVisibility.PUBLIC).stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuestionBankSummaryResponse createBank(QuestionBankCreateRequest request) {
        User currentUser = authService.getCurrentUser();

        QuestionBank questionBank = QuestionBank.builder()
                .name(request.getName().trim())
                .visibility(parseVisibility(request.getVisibility()))
                .shareToken(generateShareToken())
                .ownerUser(currentUser)
                .build();

        QuestionBank saved = questionBankRepository.save(questionBank);
        return toSummary(saved);
    }

    @Transactional
    public QuestionBankSummaryResponse updateBank(Long id, QuestionBankUpdateRequest request) {
        User currentUser = authService.getCurrentUser();
        QuestionBank questionBank = questionBankRepository.findByIdAndOwnerUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Question bank not found"));

        questionBank.setName(request.getName().trim());
        questionBank.setVisibility(parseVisibility(request.getVisibility()));

        QuestionBank saved = questionBankRepository.save(questionBank);
        return toSummary(saved);
    }

    @Transactional
    public void deleteBank(Long id) {
        User currentUser = authService.getCurrentUser();
        QuestionBank questionBank = questionBankRepository.findByIdAndOwnerUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Question bank not found"));
        questionBankRepository.delete(questionBank);
    }

    @Transactional(readOnly = true)
    public QuestionBankDetailResponse getBankForCurrentUser(Long id) {
        User currentUser = authService.getCurrentUser();
        QuestionBank questionBank = questionBankRepository.findByIdAndOwnerUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Question bank not found"));
        return toDetail(questionBank);
    }

    @Transactional(readOnly = true)
    public QuestionBankDetailResponse getPublicBankById(Long id) {
        QuestionBank questionBank = questionBankRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question bank not found"));
        if (questionBank.getVisibility() != QuestionBankVisibility.PUBLIC) {
            throw new RuntimeException("Question bank is private");
        }
        return toDetail(questionBank);
    }

    @Transactional(readOnly = true)
    public QuestionBankDetailResponse getPublicBankByShareToken(String shareToken) {
        QuestionBank questionBank = questionBankRepository.findByShareToken(shareToken)
                .orElseThrow(() -> new RuntimeException("Question bank not found"));
        if (questionBank.getVisibility() != QuestionBankVisibility.PUBLIC) {
            throw new RuntimeException("Question bank is private");
        }
        return toDetail(questionBank);
    }

    @Transactional
    public QuestionBankDetailResponse updateItems(Long id, QuestionBankItemsUpdateRequest request) {
        User currentUser = authService.getCurrentUser();
        QuestionBank questionBank = questionBankRepository.findByIdAndOwnerUserId(id, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Question bank not found"));

        List<Long> rawArtistIds = request.getArtistIds() == null ? List.of() : request.getArtistIds();
        List<Long> artistIds = rawArtistIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        if (artistIds.size() < MIN_ITEMS || artistIds.size() > MAX_ITEMS) {
            throw new RuntimeException("Question bank must contain " + MIN_ITEMS + " to " + MAX_ITEMS + " artists");
        }

        List<Artist> artists = artistRepository.findAllById(artistIds);
        if (artists.size() != artistIds.size()) {
            throw new RuntimeException("Some artists do not exist");
        }

        Map<Long, Artist> artistMap = artists.stream()
                .collect(Collectors.toMap(Artist::getId, a -> a));

        questionBank.getItems().clear();
        for (Long artistId : artistIds) {
            Artist artist = artistMap.get(artistId);
            QuestionBankItem item = QuestionBankItem.builder()
                    .questionBank(questionBank)
                    .artist(artist)
                    .build();
            questionBank.getItems().add(item);
        }

        QuestionBank saved = questionBankRepository.save(questionBank);
        return toDetail(saved);
    }

    private QuestionBankSummaryResponse toSummary(QuestionBank questionBank) {
        int itemCount = questionBankItemRepository.countByQuestionBankId(questionBank.getId());
        return QuestionBankSummaryResponse.fromEntity(questionBank, itemCount);
    }

    private QuestionBankDetailResponse toDetail(QuestionBank questionBank) {
        List<QuestionBankArtistResponse> artists = questionBank.getItems().stream()
                .map(QuestionBankItem::getArtist)
                .map(QuestionBankArtistResponse::fromEntity)
                .sorted(Comparator.comparing(a -> Optional.ofNullable(a.getName()).orElse(""), String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
        return QuestionBankDetailResponse.fromEntity(questionBank, artists);
    }

    private QuestionBankVisibility parseVisibility(String rawVisibility) {
        if (rawVisibility == null || rawVisibility.isBlank()) {
            return QuestionBankVisibility.PUBLIC;
        }
        try {
            return QuestionBankVisibility.valueOf(rawVisibility.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Visibility must be PUBLIC or PRIVATE");
        }
    }

    private String generateShareToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }
}
