package com.Project.UPI_Simulation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AuthResponse {

    private String token; // For backward compatibility
    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long expiresIn;
    private UserSessionResponse user;

    public AuthResponse(String token, UserSessionResponse user) {
        this.token = token;
        this.accessToken = token;
        this.tokenType = "Bearer";
        this.user = user;
    }
}

