package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.AuthResponse;
import com.Project.UPI_Simulation.dto.ChangePasswordRequest;
import com.Project.UPI_Simulation.dto.RefreshTokenRequest;
import com.Project.UPI_Simulation.dto.UserSessionResponse;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.AuthSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/auth", "/api/v1/auth"})
@RequiredArgsConstructor
@Validated
@Tag(name = "Authentication", description = "User registration, login, JWT token refresh, and password management APIs")
public class AuthController {

    private final AuthService authService;
    private final AuthSessionService authSessionService;

    @PostMapping("/signup")
    @Operation(summary = "Register new user account")
    public AuthResponse signup(@Valid @RequestBody CreateProfileRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/create-profile")
    @Operation(summary = "Create profile (alias for signup)")
    public AuthResponse createProfile(@Valid @RequestBody CreateProfileRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and issue JWT access and refresh tokens")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh JWT access token using refresh token")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password or PIN")
    public ApiResponse<String> changePassword(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        authService.changePassword(currentUser, request);
        return ApiResponse.success("Password changed successfully", "OK");
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public UserSessionResponse me(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return authService.getCurrentUser(authorizationHeader);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user and invalidate session/token")
    public String logout(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return authService.logout(authorizationHeader);
    }
}

