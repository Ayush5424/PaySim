package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.AuthResponse;
import com.Project.UPI_Simulation.dto.UserSessionResponse;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.Project.UPI_Simulation.service.AuthSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final AuthSessionService authSessionService;

    /**
     * Signup: validate uniqueness, create user + account, create session, return AuthResponse.
     */
    @Transactional
    public AuthResponse signup(CreateProfileRequest request) {
        validateUniqueUserFields(request.getPhoneNumber(), request.getEmail());

        User user = new User();

        String trimmedName = request.getName().trim();
        user.setName(trimmedName);
        user.setDisplayName(trimmedName);
        user.setPhoneNumber(request.getPhoneNumber());
        user.setEmail(normalizeEmail(request.getEmail()));
        user.setPin(request.getPin());
        user.setVerified(true);

        user.setUpiId(generateUniqueUpiId(trimmedName));

        User savedUser = userRepository.save(user);

        Account account = new Account();
        account.setUser(savedUser);
        account.setAccountNumber(UUID.randomUUID().toString());
        account.setBalance(BigDecimal.ZERO);
        account.setPin(request.getPin());

        accountRepository.save(account);

        return new AuthResponse(
                authSessionService.createSession(savedUser),
                UserSessionResponse.from(savedUser)
        );
    }

    /**
     * Login: validate user credentials (name + phone), create session, return AuthResponse.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByNameAndPhoneNumber(request.getName(), request.getPhoneNumber())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthResponse(
                authSessionService.createSession(user),
                UserSessionResponse.from(user)
        );
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

    private void validateUniqueUserFields(String phoneNumber, String email) {
        if (userRepository.existsByPhoneNumber(phoneNumber)) {
            throw new RuntimeException("Phone number already registered");
        }

        String normalizedEmail = normalizeEmail(email);
        if (normalizedEmail != null && userRepository.existsByEmail(normalizedEmail)) {
            throw new RuntimeException("Email already registered");
        }
    }

    private String generateUniqueUpiId(String name) {
        String base = name.toLowerCase().replaceAll("[^a-z0-9]", "");
        if (base.isBlank()) {
            base = "user";
        }

        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            String candidate = base + (1000 + random.nextInt(9000)) + "@upi";
            if (!userRepository.existsByUpiId(candidate)) {
                return candidate;
            }
        }

        throw new RuntimeException("UPI ID already exists");
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return email.trim().toLowerCase();
    }

}
