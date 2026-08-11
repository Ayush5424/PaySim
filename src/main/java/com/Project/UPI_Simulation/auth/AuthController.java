package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.AuthResponse;
import com.Project.UPI_Simulation.dto.UserSessionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {
    private final AuthService authService;

    @PostMapping("/signup")
    public AuthResponse signup(@Valid @RequestBody CreateProfileRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/create-profile")
    public AuthResponse createProfile(@Valid @RequestBody CreateProfileRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserSessionResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.getCurrentUser(authorizationHeader);
    }

    @PostMapping("/logout")
    public String logout(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.logout(authorizationHeader);
    }
}
