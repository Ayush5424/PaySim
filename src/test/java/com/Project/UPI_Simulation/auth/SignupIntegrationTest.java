package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.AuthResponse;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class SignupIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Test
    @DisplayName("Verify user signup persists cleanly with all required entity fields")
    @Transactional
    public void testSignupAndPersistence() {
        long random9Digits = 100000000L + (long) (new Random().nextDouble() * 899999999L);
        String testPhone = "9" + random9Digits;
        String testEmail = "testuser" + random9Digits + "@paysim.test";

        CreateProfileRequest request = CreateProfileRequest.builder()
                .name("Signup Test User")
                .phoneNumber(testPhone)
                .email(testEmail)
                .pin("1234")
                .password("Password123!")
                .initialBalance(new BigDecimal("500.00"))
                .build();

        AuthResponse response = authService.signup(request);

        assertNotNull(response, "Auth response should not be null");
        assertNotNull(response.getAccessToken(), "Access token should be issued");
        assertNotNull(response.getUser(), "User summary should be returned");
        assertEquals("Signup Test User", response.getUser().getName());

        User savedUser = userRepository.findByPhoneNumber(testPhone)
                .orElseThrow(() -> new AssertionError("User not found in repository"));

        assertNotNull(savedUser.getId(), "User ID should be generated");
        assertNotNull(savedUser.getCreatedAt(), "createdAt column must exist and be populated");
        assertNotNull(savedUser.getUpdatedAt(), "updatedAt column must exist and be populated");
        assertNotNull(savedUser.getPinHash(), "pinHash column must exist and be populated");
        assertEquals("ACTIVE", savedUser.getStatus(), "status must default to ACTIVE");
        assertEquals(0, savedUser.getFailedLoginAttempts(), "failedLoginAttempts must default to 0");
        assertTrue(savedUser.isVerified(), "verified must be true");

        Account savedAccount = accountRepository.findByUser(savedUser)
                .orElseThrow(() -> new AssertionError("Account not found in repository"));

        assertNotNull(savedAccount.getId(), "Account ID should be generated");
        assertEquals("INR", savedAccount.getCurrency(), "currency must be INR");
        assertEquals("ACTIVE", savedAccount.getStatus(), "account status must be ACTIVE");
        assertNotNull(savedAccount.getCreatedAt(), "account createdAt must be populated");
        assertEquals(0, new BigDecimal("500.00").compareTo(savedAccount.getBalance()));
    }
}
