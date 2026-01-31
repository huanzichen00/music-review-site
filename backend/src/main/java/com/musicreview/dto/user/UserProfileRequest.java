package com.musicreview.dto.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRequest {

    @Size(max = 255, message = "Avatar URL must be less than 255 characters")
    private String avatarUrl;

    @Size(max = 500, message = "Bio must be less than 500 characters")
    private String bio;
}
