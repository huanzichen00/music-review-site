package com.musicreview.dto.blog;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BlogReplyRequest {

    @NotNull(message = "Blog post ID is required")
    private Long blogPostId;

    @NotBlank(message = "Content is required")
    @Size(max = 1000, message = "Content must be less than 1000 characters")
    private String content;
}

