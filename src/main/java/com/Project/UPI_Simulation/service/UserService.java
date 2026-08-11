package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.dto.ProfileUpdateRequest;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final AccountRepository accountRepo;
    private final AuthSessionService authSessionService;

    public User createUser(User user) {
        validateUniqueUser(user);

        user.setUpiId(user.getName().toLowerCase() + "@okbank");
        if (userRepo.existsByUpiId(user.getUpiId())) {
            throw new RuntimeException("UPI ID already exists");
        }
        user.setDisplayName(user.getName());

        User savedUser = userRepo.save(user);

        Account account = new Account();
        account.setUser(savedUser);
        account.setAccountNumber(UUID.randomUUID().toString());
        account.setBalance(BigDecimal.ZERO); //
        account.setPin("1234");

        accountRepo.save(account);

        return savedUser;
    }

    // Get balance
    public BigDecimal getBalance(String upiId) {

        User user = userRepo.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account account = accountRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        return account.getBalance();
    }

    public BigDecimal getBalance(String upiId, String pin) {
        User user = userRepo.findByUpiId(upiId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Account account = accountRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        if (!account.getPin().equals(pin)) {
            throw new RuntimeException("Invalid PIN");
        }

        return account.getBalance();
    }

    public User getUserByPhone(String phoneNumber){
        return userRepo.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
    }

    public User getUserByPhoneForCurrentUser(String phoneNumber, String authorizationHeader) {
        authSessionService.requireUser(authorizationHeader);
        return getUserByPhone(phoneNumber);
    }

    public User getCurrentUser(String authorizationHeader) {
        return authSessionService.requireUser(authorizationHeader);
    }

    public BigDecimal getBalanceForCurrentUser(String upiId, String pin, String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        requireSameUpi(currentUser, upiId);
        return getBalance(upiId, pin);
    }

    public void requireSameUpi(User user, String upiId) {
        if (!user.getUpiId().equals(upiId)) {
            throw new RuntimeException("You are not allowed to access this account");
        }
    }

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

    public User removeProfilePhoto(String phoneNumber, String authorizationHeader) {
        User user = authSessionService.requireUser(authorizationHeader);
        requireSamePhone(user, phoneNumber);
        user.setProfilePhoto(null);
        return userRepo.save(user);
    }

    @org.springframework.transaction.annotation.Transactional
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
