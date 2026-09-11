package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.TransactionRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class PaymentConcurrencyTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private com.Project.UPI_Simulation.repository.AuthSessionRepository authSessionRepository;

    @Autowired
    private com.Project.UPI_Simulation.repository.RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private com.Project.UPI_Simulation.repository.IdempotencyRepository idempotencyRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private com.Project.UPI_Simulation.repository.NotificationRepository notificationRepository;

    @Autowired
    private com.Project.UPI_Simulation.repository.AuditLogRepository auditLogRepository;

    @Autowired
    private com.Project.UPI_Simulation.security.JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User sender;
    private User receiver;
    private String senderToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        authSessionRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        idempotencyRepository.deleteAll();
        transactionRepository.deleteAll();
        accountRepository.deleteAll();
        userRepository.deleteAll();

        String rawPin = "1234";
        String encodedPin = passwordEncoder.encode(rawPin);

        sender = User.builder()
                .name("Sender User")
                .phoneNumber("9000000001")
                .email("sender@test.com")
                .upiId("sender@paysim")
                .pinHash(encodedPin)
                .pin(rawPin)
                .status("ACTIVE")
                .verified(true)
                .build();
        sender = userRepository.save(sender);

        Account senderAcc = Account.builder()
                .user(sender)
                .accountNumber("ACC_SENDER")
                .balance(new BigDecimal("1000.00"))
                .pinHash(encodedPin)
                .pin(rawPin)
                .status("ACTIVE")
                .build();
        accountRepository.save(senderAcc);

        receiver = User.builder()
                .name("Receiver User")
                .phoneNumber("9000000002")
                .email("receiver@test.com")
                .upiId("receiver@paysim")
                .pinHash(encodedPin)
                .pin(rawPin)
                .status("ACTIVE")
                .verified(true)
                .build();
        receiver = userRepository.save(receiver);

        Account receiverAcc = Account.builder()
                .user(receiver)
                .accountNumber("ACC_RECEIVER")
                .balance(new BigDecimal("0.00"))
                .pinHash(encodedPin)
                .pin(rawPin)
                .status("ACTIVE")
                .build();
        accountRepository.save(receiverAcc);

        senderToken = "Bearer " + jwtTokenProvider.generateAccessToken(sender.getId(), sender.getUpiId(), sender.getEmail(), sender.getPhoneNumber());
    }

    @Test
    @DisplayName("Verify race condition protection: 20 concurrent transfers of ₹100 from ₹1,000 balance must result in exactly 10 successes and ₹0 balance")
    void testConcurrentPaymentRaceConditionProtection() throws InterruptedException {
        int concurrentCount = 20;
        BigDecimal transferAmount = new BigDecimal("100.00");

        ExecutorService executorService = Executors.newFixedThreadPool(concurrentCount);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(concurrentCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < concurrentCount; i++) {
            executorService.submit(() -> {
                try {
                    latch.await(); // Synchronize all threads start line
                    PaymentRequest request = PaymentRequest.builder()
                            .fromUpi(sender.getUpiId())
                            .toUpi(receiver.getUpiId())
                            .amount(transferAmount)
                            .pin("1234")
                            .build();

                    paymentService.sendMoney(request, senderToken);
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    System.err.println("Concurrency thread failed: " + ex.getClass().getName() + " - " + ex.getMessage());
                    failureCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        latch.countDown(); // Release all threads simultaneously
        doneLatch.await(); // Wait for all threads to finish execution
        executorService.shutdown();

        Account finalSenderAcc = accountRepository.findByUser(sender).orElseThrow();
        Account finalReceiverAcc = accountRepository.findByUser(receiver).orElseThrow();

        assertEquals(10, successCount.get(), "Exactly 10 transactions should succeed before balance runs out");
        assertEquals(10, failureCount.get(), "Exactly 10 transactions should fail due to insufficient balance");
        assertEquals(0, new BigDecimal("0.00").compareTo(finalSenderAcc.getBalance()), "Sender balance should be exactly 0.00");
        assertEquals(0, new BigDecimal("1000.00").compareTo(finalReceiverAcc.getBalance()), "Receiver balance should be exactly 1000.00");
    }
}
