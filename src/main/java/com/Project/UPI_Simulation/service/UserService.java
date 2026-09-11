package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.dto.ProfileUpdateRequest;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final AccountRepository accountRepo;
    private final AuthSessionService authSessionService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User createUser(User user) {
        validateUniqueUser(user);

        if (user.getUpiId() == null || user.getUpiId().isBlank()) {
            user.setUpiId(user.getName().toLowerCase().replaceAll("[^a-z0-9]", "") + "@paysim");
        }
        if (userRepo.existsByUpiId(user.getUpiId())) {
            throw new RuntimeException("UPI ID already exists");
        }
        user.setDisplayName(user.getName());
        
        if (user.getPin() != null && !user.getPin().isBlank()) {
            user.setPinHash(passwordEncoder.encode(user.getPin()));
            user.setPasswordHash(user.getPinHash());
        }

        User savedUser = userRepo.save(user);

        Account account = new Account();
        account.setUser(savedUser);
        account.setAccountNumber("ACC" + (1000000000L + new Random().nextInt(900000000)));
        account.setBalance(BigDecimal.ZERO);
        account.setPinHash(savedUser.getPinHash());
        account.setPin(savedUser.getPin());

        accountRepo.save(account);

        return savedUser;
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalance(String upiId) {
        User user = userRepo.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account account = accountRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return account.getBalance();
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalance(String upiId, String pin) {
        User user = userRepo.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account account = accountRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        boolean pinValid = (account.getPinHash() != null && passwordEncoder.matches(pin, account.getPinHash()))
                || (user.getPinHash() != null && passwordEncoder.matches(pin, user.getPinHash()))
                || pin.equals(account.getPin())
                || pin.equals(user.getPin());

        if (!pinValid) {
            throw new RuntimeException("Invalid PIN");
        }

        return account.getBalance();
    }

    @Transactional(readOnly = true)
    public User getUserByPhone(String phoneNumber) {
        return userRepo.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
    }

    @Transactional(readOnly = true)
    public User getUserByPhoneForCurrentUser(String phoneNumber, String authorizationHeader) {
        authSessionService.requireUser(authorizationHeader);
        return getUserByPhone(phoneNumber);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String authorizationHeader) {
        return authSessionService.requireUser(authorizationHeader);
    }

    @Transactional(readOnly = true)
    public BigDecimal getBalanceForCurrentUser(String upiId, String pin, String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        requireSameUpi(currentUser, upiId);
        return getBalance(upiId, pin);
    }

    public void requireSameUpi(User user, String upiId) {
        if (!user.getUpiId().equalsIgnoreCase(upiId)) {
            throw new RuntimeException("You are not allowed to access this account");
        }
    }

    @Transactional
    public User updateProfile(String phoneNumber, ProfileUpdateRequest request, String authorizationHeader) {
        User user = authSessionService.requireUser(authorizationHeader);
        requireSamePhone(user, phoneNumber);

        String displayName = request.getDisplayName();
        if (displayName == null || displayName.isBlank()) {
            displayName = request.getName();
        }

        if (displayName != null && !displayName.isBlank()) {
            user.setName(displayName.trim());
            user.setDisplayName(displayName.trim());
        }

        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto().isBlank() ? null : request.getProfilePhoto());
        }

        return userRepo.save(user);
    }

    @Transactional
    public User removeProfilePhoto(String phoneNumber, String authorizationHeader) {
        User user = authSessionService.requireUser(authorizationHeader);
        requireSamePhone(user, phoneNumber);
        user.setProfilePhoto(null);
        return userRepo.save(user);
    }

    @Transactional
    public void deleteCurrentAccount(String authorizationHeader) {
        User user = authSessionService.requireUser(authorizationHeader);
        accountRepo.deleteByUser(user);
        authSessionService.deleteSessionsForUser(user);
        userRepo.delete(user);
    }

    private void validateUniqueUser(User user) {
        if (userRepo.existsByPhoneNumber(user.getPhoneNumber())) {
            throw new RuntimeException("Phone number already registered");
        }
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            user.setEmail(user.getEmail().trim().toLowerCase());
            if (userRepo.existsByEmail(user.getEmail())) {
                throw new RuntimeException("Email already registered");
            }
        }
    }

    private void requireSamePhone(User user, String phoneNumber) {
        if (!user.getPhoneNumber().equals(phoneNumber)) {
            throw new RuntimeException("You are not allowed to update this profile");
        }
    }
}

