package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.TransactionRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final UserRepository userRepo;
    private final AccountRepository accountRepo;
    private final TransactionRepository txnRepo;

    @Transactional
    public Map<String, Object> sendMoney(PaymentRequest request) {

        if (request.getFromUpi().equals(request.getToUpi())) {
            throw new RuntimeException("Cannot send money to yourself");
        }

        if (request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid amount");
        }

        User sender = userRepo.findByUpiId(request.getFromUpi())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepo.findByUpiId(request.getToUpi())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Account senderAcc = accountRepo.findByUser(sender)
                .orElseThrow(() -> new RuntimeException("Sender account not found"));

        Account receiverAcc = accountRepo.findByUser(receiver)
                .orElseThrow(() -> new RuntimeException("Receiver account not found"));

        if (!senderAcc.getPin().equals(request.getPin())) {
            throw new RuntimeException("Invalid PIN");
        }

        BigDecimal amount = request.getAmount();

        if (senderAcc.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        senderAcc.setBalance(senderAcc.getBalance().subtract(amount));
        receiverAcc.setBalance(receiverAcc.getBalance().add(amount));

        accountRepo.save(senderAcc);
        accountRepo.save(receiverAcc);

        Transaction txn = new Transaction();
        txn.setTransactionId(UUID.randomUUID().toString());
        txn.setSenderUpi(request.getFromUpi());
        txn.setReceiverUpi(request.getToUpi());
        txn.setAmount(amount);
        txn.setStatus("PENDING");
        txn.setTimestamp(LocalDate.from(LocalDateTime.now()));

        txnRepo.save(txn);

        txn.setStatus("SUCCESS");
        txnRepo.save(txn);

        Map<String, Object> response = new HashMap<>();
        response.put("amount", amount);
        response.put("from", request.getFromUpi());
        response.put("to", request.getToUpi());
        response.put("transactionId", txn.getTransactionId());

        return response;
    }

    public List<Transaction> getTransactions(String upiId) {
        return txnRepo.findBySenderUpiOrReceiverUpi(upiId, upiId);
    }
}