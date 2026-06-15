package com.Project.UPI_Simulation.service;

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

    public User createUser(User user) {

        user.setUpiId(user.getName().toLowerCase() + "@okbank");

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

    public User getUserByPhone(String phoneNumber){
        return userRepo.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("User Not Found"));
    }
}