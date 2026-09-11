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
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class IdempotencyTest {

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
    @DisplayName("Duplicate request with same Idempotency-Key should return identical response and not double debit")
    void testIdempotencyPreventsDuplicateDebits() {
        String idempotencyKey = "IDEM-" + UUID.randomUUID();
        PaymentRequest request = PaymentRequest.builder()
                .fromUpi(sender.getUpiId())
                .toUpi(receiver.getUpiId())
                .amount(new BigDecimal("250.00"))
                .pin("1234")
                .build();

        // First Execution
        Map<String, Object> response1 = paymentService.sendMoney(request, senderToken, idempotencyKey);
        assertNotNull(response1);
        assertEquals(new BigDecimal("250.00"), new BigDecimal(response1.get("amount").toString()));
        String firstTxnId = response1.get("transactionId").toString();

        // Second Execution (Replay with same idempotency key)
        Map<String, Object> response2 = paymentService.sendMoney(request, senderToken, idempotencyKey);
        assertNotNull(response2);
        assertEquals(firstTxnId, response2.get("transactionId").toString(), "Replayed response must return exact same transaction ID");

        // Verify Account Balances
        Account finalSenderAcc = accountRepository.findByUser(sender).orElseThrow();
        Account finalReceiverAcc = accountRepository.findByUser(receiver).orElseThrow();

        assertEquals(0, new BigDecimal("750.00").compareTo(finalSenderAcc.getBalance()), "Sender should only be debited once (750.00 remaining)");
        assertEquals(0, new BigDecimal("250.00").compareTo(finalReceiverAcc.getBalance()), "Receiver should only be credited once (250.00)");
        assertEquals(1, transactionRepository.count(), "Transaction table should contain exactly 1 transaction record");
    }
}
