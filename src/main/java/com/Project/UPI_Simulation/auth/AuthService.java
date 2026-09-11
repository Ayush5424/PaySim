package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.AuthResponse;
import com.Project.UPI_Simulation.dto.ChangePasswordRequest;
import com.Project.UPI_Simulation.dto.RefreshTokenRequest;
import com.Project.UPI_Simulation.dto.UserSessionResponse;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.RefreshToken;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.RefreshTokenRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.Project.UPI_Simulation.security.JwtTokenProvider;
import com.Project.UPI_Simulation.service.AuditService;
import com.Project.UPI_Simulation.service.AuthSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_TIME_MINUTES = 15;

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuthSessionService authSessionService;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Registration: validate uniqueness, create user & account, hash secret, return AuthResponse with JWT.
     */
    @Transactional
    public AuthResponse signup(CreateProfileRequest request) {
        validateUniqueUserFields(request.getPhoneNumber(), request.getEmail(), request.getUpiId());

        User user = new User();
        String trimmedName = request.getName().trim();
        user.setName(trimmedName);
        user.setDisplayName(trimmedName);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmail(normalizeEmail(request.getEmail()));
        
        String secret = request.getEffectivePassword();
        user.setPasswordHash(passwordEncoder.encode(secret));
        user.setPinHash(passwordEncoder.encode(request.getPin() != null ? request.getPin() : secret));
        user.setPin(request.getPin() != null ? request.getPin() : secret);
        user.setVerified(true);
        user.setStatus("ACTIVE");

        if (request.getUpiId() != null && !request.getUpiId().isBlank()) {
            user.setUpiId(request.getUpiId().trim().toLowerCase());
        } else {
            user.setUpiId(generateUniqueUpiId(trimmedName));
        }

        User savedUser = userRepository.save(user);

        Account account = new Account();
        account.setUser(savedUser);
        account.setAccountNumber("ACC" + (1000000000L + new Random().nextInt(900000000)));
        BigDecimal initialBalance = request.getInitialBalance() != null && request.getInitialBalance().compareTo(BigDecimal.ZERO) >= 0
                ? request.getInitialBalance()
                : BigDecimal.ZERO;
        account.setBalance(initialBalance);
        account.setCurrency("INR");
        account.setStatus("ACTIVE");
        account.setPinHash(savedUser.getPinHash());
        account.setPin(savedUser.getPin());

        accountRepository.save(account);
        auditService.logEvent(savedUser.getId(), "USER_REGISTRATION", "SUCCESS", "Registered user: " + savedUser.getUpiId());

        return buildAuthResponse(savedUser);
    }

    /**
     * Login: validate user credentials (email/phone/UPI + password/pin), track failed attempts & lockouts, issue JWT.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getEffectiveIdentifier();
        String secret = request.getEffectiveSecret();

        User user = userRepository.findByIdentifier(identifier)
                .or(() -> userRepository.findByNameAndPhoneNumber(request.getName(), request.getPhoneNumber()))
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (user.isAccountLocked()) {
            auditService.logEvent(user.getId(), "LOGIN_ATTEMPT", "FAILED", "Account locked");
            throw new RuntimeException("Account is temporarily locked due to excessive failed attempts. Try again later.");
        }

        if ("SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Account is suspended. Contact support.");
        }

        boolean passwordMatches = user.getPasswordHash() != null && passwordEncoder.matches(secret, user.getPasswordHash());
        boolean pinMatches = user.getPinHash() != null && passwordEncoder.matches(secret, user.getPinHash());
        boolean legacyPinMatches = secret.equals(user.getPin());

        if (!passwordMatches && !pinMatches && !legacyPinMatches) {
            handleFailedLogin(user);
            throw new RuntimeException("Invalid credentials");
        }

        // Successful authentication: reset failed attempts
        if (user.getFailedLoginAttempts() > 0 || user.getLockUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockUntil(null);
            userRepository.save(user);
        }

        auditService.logEvent(user.getId(), "LOGIN_SUCCESS", "SUCCESS", "Logged in via " + identifier);
        return buildAuthResponse(user);
    }

    /**
     * Refresh Token Flow
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        String rawToken = request.getRefreshToken();
        String hash = hashToken(rawToken);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (refreshToken.isRevoked() || refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh token is expired or revoked");
        }

        User user = refreshToken.getUser();
        if (user.isAccountLocked() || "SUSPENDED".equalsIgnoreCase(user.getStatus())) {
            throw new RuntimeException("Account disabled");
        }

        // Rotate token
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return buildAuthResponse(user);
    }

    /**
     * Password / PIN Change
     */
    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        boolean validCurrent = (currentUser.getPasswordHash() != null && passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPasswordHash()))
                || (currentUser.getPinHash() != null && passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPinHash()))
                || request.getCurrentPassword().equals(currentUser.getPin());

        if (!validCurrent) {
            auditService.logEvent(currentUser.getId(), "PASSWORD_CHANGE", "FAILED", "Invalid current password");
            throw new RuntimeException("Current password or PIN is incorrect");
        }

        String encodedNew = passwordEncoder.encode(request.getNewPassword());
        currentUser.setPasswordHash(encodedNew);
        currentUser.setPinHash(encodedNew);
        currentUser.setPin(request.getNewPassword());

        userRepository.save(currentUser);

        // Update account pin hash as well
        accountRepository.findByUser(currentUser).ifPresent(account -> {
            account.setPinHash(encodedNew);
            account.setPin(request.getNewPassword());
            accountRepository.save(account);
        });

        auditService.logEvent(currentUser.getId(), "PASSWORD_CHANGE", "SUCCESS", "Password updated successfully");
    }

    @Transactional(readOnly = true)
    public UserSessionResponse getCurrentUser(String authorizationHeader) {
        return UserSessionResponse.from(authSessionService.requireUser(authorizationHeader));
    }

    @Transactional
    public String logout(String authorizationHeader) {
        authSessionService.logout(authorizationHeader);
        return "Logged out successfully";
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getUpiId(), user.getEmail(), user.getPhoneNumber());
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken(user.getId());
        String legacySessionToken = authSessionService.createSession(user);

        // Store refresh token entity
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(refreshTokenStr))
                .expiresAt(Instant.now().plusMillis(jwtTokenProvider.getRefreshTokenExpirationMs()))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .token(accessToken != null ? accessToken : legacySessionToken)
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(UserSessionResponse.from(user))
                .build();
    }

    private void handleFailedLogin(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);

        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockUntil(LocalDateTime.now().plusMinutes(LOCK_TIME_MINUTES));
            user.setStatus("LOCKED");
            log.warn("User account locked due to {} failed attempts: ID={}", attempts, user.getId());
            auditService.logEvent(user.getId(), "ACCOUNT_LOCKOUT", "WARNING", "Locked for " + LOCK_TIME_MINUTES + " mins");
        } else {
            auditService.logEvent(user.getId(), "LOGIN_FAILED", "FAILED", "Attempt " + attempts + " of " + MAX_FAILED_ATTEMPTS);
        }

        userRepository.save(user);
    }

    private void validateUniqueUserFields(String phoneNumber, String email, String upiId) {
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new RuntimeException("Phone number already registered");
        }

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already registered");
        }

        if (upiId != null && !upiId.isBlank() && userRepository.existsByUpiId(upiId.trim().toLowerCase())) {
            throw new RuntimeException("UPI ID already registered");
        }
    }

    private String generateUniqueUpiId(String name) {
        String base = name.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) {
            base = "user";
        }

        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            String candidate = base + (1000 + random.nextInt(9000)) + "@paysim";
            if (!userRepository.existsByUpiId(candidate)) {
                return candidate;
            }
        }

        return base + System.currentTimeMillis() % 10000 + "@paysim";
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is not available", ex);
        }
    }
}

