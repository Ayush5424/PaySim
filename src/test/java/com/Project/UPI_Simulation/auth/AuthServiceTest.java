package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.dto.AuthResponse;

import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.RefreshTokenRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.Project.UPI_Simulation.security.JwtTokenProvider;
import com.Project.UPI_Simulation.service.AuditService;
import com.Project.UPI_Simulation.service.AuthSessionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AccountRepository accountRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private AuthSessionService authSessionService;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private CreateProfileRequest signupRequest;

    @BeforeEach
    void setUp() {
        signupRequest = CreateProfileRequest.builder()
                .name("Alice Smith")
                .phoneNumber("9876543210")
                .email("alice@example.com")
                .pin("1234")
                .password("Secret123!")
                .initialBalance(new BigDecimal("1000.00"))
                .build();
    }

    @Test
    @DisplayName("Should successfully sign up user with hashed password and account")
    void testSignupSuccess() {
        when(userRepository.existsByPhoneNumber(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode("Secret123!")).thenReturn("$2a$10$hashedPassword");
        when(passwordEncoder.encode("1234")).thenReturn("$2a$10$hashedPin");

        User savedUser = User.builder()
                .id(1L)
                .name("Alice Smith")
                .phoneNumber("9876543210")
                .email("alice@example.com")
                .upiId("alicesmith1234@paysim")
                .status("ACTIVE")
                .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtTokenProvider.generateAccessToken(anyLong(), anyString(), anyString(), anyString())).thenReturn("mock.jwt.token");
        when(jwtTokenProvider.generateRefreshToken(anyLong())).thenReturn("mock.refresh.token");
        when(authSessionService.createSession(any(User.class))).thenReturn("mock.session.token");

        AuthResponse response = authService.signup(signupRequest);

        assertNotNull(response);
        assertEquals("mock.jwt.token", response.getAccessToken());
        assertEquals("mock.refresh.token", response.getRefreshToken());
        assertEquals("Alice Smith", response.getUser().getName());
        verify(userRepository).save(any(User.class));
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    @DisplayName("Should throw exception when registering duplicate phone number")
    void testSignupDuplicatePhone() {
        when(userRepository.existsByPhoneNumber("9876543210")).thenReturn(true);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.signup(signupRequest));
        assertTrue(ex.getMessage().contains("Phone number already registered"));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should lock account after excessive failed login attempts")
    void testAccountLockoutOnFailedLogin() {
        User user = User.builder()
                .id(1L)
                .name("Bob")
                .phoneNumber("9999999999")
                .passwordHash("$2a$10$hashedPassword")
                .pinHash("$2a$10$hashedPin")
                .status("ACTIVE")
                .failedLoginAttempts(4)
                .build();

        LoginRequest loginReq = LoginRequest.builder()
                .identifier("9999999999")
                .password("WrongPassword")
                .build();

        when(userRepository.findByIdentifier("9999999999")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$hashedPassword")).thenReturn(false);
        when(passwordEncoder.matches("WrongPassword", "$2a$10$hashedPin")).thenReturn(false);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> authService.login(loginReq));
        assertEquals("Invalid credentials", ex.getMessage());
        assertEquals(5, user.getFailedLoginAttempts());
        assertEquals("LOCKED", user.getStatus());
        assertNotNull(user.getLockUntil());
        verify(userRepository).save(user);
    }
}
