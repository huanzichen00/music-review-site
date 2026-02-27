package com.musicreview.dto.questionbank;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionBankItemsUpdateRequest {

    @NotNull(message = "artistIds is required")
    private List<Long> artistIds;
}
