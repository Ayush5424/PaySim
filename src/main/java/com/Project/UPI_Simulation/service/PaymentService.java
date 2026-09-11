package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.config.CorrelationIdFilter;
import com.Project.UPI_Simulation.dto.PagedResponse;
import com.Project.UPI_Simulation.dto.PaymentReceiptResponse;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.IdempotencyRecord;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.event.PaymentEvent;
import com.Project.UPI_Simulation.event.PaymentEventProducer;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.repository.TransactionRepository;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final UserRepository userRepo;
    private final AccountRepository accountRepo;
    private final TransactionRepository txnRepo;
    private final AuthSessionService authSessionService;
    private final IdempotencyService idempotencyService;
    private final PaymentEventProducer paymentEventProducer;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Transactional
    public Map<String, Object> sendMoney(PaymentRequest request, String authorizationHeader, String idempotencyKey) {
        User currentUser = authSessionService.requireUser(authorizationHeader);

        if (request.getFromUpi() == null || request.getFromUpi().isBlank()) {
            request.setFromUpi(currentUser.getUpiId());
        } else if (!currentUser.getUpiId().equalsIgnoreCase(request.getFromUpi())) {
            throw new RuntimeException("Unauthorized sender");
        }

        if (request.getFromUpi().equalsIgnoreCase(request.getToUpi())) {
            throw new RuntimeException("Cannot send money to yourself");
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Invalid amount");
        }

        // 1. Idempotency Check
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            Optional<IdempotencyRecord> existing = idempotencyService.checkIdempotency(idempotencyKey, request.toString());
            if (existing.isPresent()) {
                IdempotencyRecord record = existing.get();
                if ("PROCESSING".equalsIgnoreCase(record.getStatus())) {
                    throw new RuntimeException("A payment request with this Idempotency-Key is currently processing.");
                }
                if (record.getResponseBody() != null) {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> cachedResponse = objectMapper.readValue(record.getResponseBody(), Map.class);
                        return cachedResponse;
                    } catch (Exception ignored) {
                    }
                }
            }
            idempotencyService.registerKey(idempotencyKey, currentUser.getId(), request.toString());
        }

        // 2. Validate Users
        User sender = userRepo.findByUpiId(request.getFromUpi())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        User receiver = userRepo.findByUpiId(request.getToUpi())
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        if (!"ACTIVE".equalsIgnoreCase(sender.getStatus()) || sender.isAccountLocked()) {
            throw new RuntimeException("Sender account is not active");
        }

        if (!"ACTIVE".equalsIgnoreCase(receiver.getStatus())) {
            throw new RuntimeException("Receiver account is not active");
        }

        // 3. Fetch Accounts with Pessimistic Write Lock in Consistent Order to Prevent Deadlocks
        Long senderAccId = accountRepo.findAccountIdByUserId(sender.getId())
                .orElseThrow(() -> new RuntimeException("Sender account not found"));
        Long receiverAccId = accountRepo.findAccountIdByUserId(receiver.getId())
                .orElseThrow(() -> new RuntimeException("Receiver account not found"));

        Long firstAccountId = Math.min(senderAccId, receiverAccId);
        Long secondAccountId = Math.max(senderAccId, receiverAccId);

        Account firstAcc = accountRepo.findByIdWithLock(firstAccountId)
                .orElseThrow(() -> new RuntimeException("Account lock acquisition failed"));
        Account secondAcc = accountRepo.findByIdWithLock(secondAccountId)
                .orElseThrow(() -> new RuntimeException("Account lock acquisition failed"));

        Account senderAcc = senderAccId.equals(firstAccountId) ? firstAcc : secondAcc;
        Account receiverAcc = receiverAccId.equals(firstAccountId) ? firstAcc : secondAcc;

        // 4. Verify PIN
        String providedPin = request.getPin();
        boolean pinValid = (senderAcc.getPinHash() != null && passwordEncoder.matches(providedPin, senderAcc.getPinHash()))
                || (sender.getPinHash() != null && passwordEncoder.matches(providedPin, sender.getPinHash()))
                || providedPin.equals(senderAcc.getPin())
                || providedPin.equals(sender.getPin());

        if (!pinValid) {
            throw new RuntimeException("Invalid PIN");
        }

        BigDecimal amount = request.getAmount();

        // 5. Balance Validation
        if (senderAcc.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient balance");
        }

        // 6. Create Transaction Record (INITIATED -> PROCESSING)
        String txnId = UUID.randomUUID().toString().replace("-", "");
        String refId = "REF" + System.currentTimeMillis() + (new Random().nextInt(900) + 100);

        Transaction txn = Transaction.builder()
                .transactionId(txnId)
                .referenceId(refId)
                .senderUpi(request.getFromUpi())
                .receiverUpi(request.getToUpi())
                .amount(amount)
                .currency("INR")
                .status("PROCESSING")
                .paymentMethod("UPI_ID")
                .idempotencyKey(idempotencyKey)
                .build();

        txnRepo.save(txn);

        try {
            // 7. Atomic Balance Update
            senderAcc.setBalance(senderAcc.getBalance().subtract(amount));
            receiverAcc.setBalance(receiverAcc.getBalance().add(amount));

            accountRepo.save(senderAcc);
            accountRepo.save(receiverAcc);

            // 8. Commit SUCCESS
            txn.setStatus("SUCCESS");
            txnRepo.save(txn);

            Map<String, Object> response = new HashMap<>();
            response.put("amount", amount);
            response.put("currency", "INR");
            response.put("from", request.getFromUpi());
            response.put("to", request.getToUpi());
            response.put("transactionId", txn.getTransactionId());
            response.put("referenceId", txn.getReferenceId());
            response.put("status", "SUCCESS");

            String responseJson = objectMapper.writeValueAsString(response);
            if (idempotencyKey != null && !idempotencyKey.isBlank()) {
                idempotencyService.saveResult(idempotencyKey, responseJson, 200);
            }

            // 9. Publish Payment Succeeded Event
            PaymentEvent event = PaymentEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType("PAYMENT_SUCCEEDED")
                    .transactionId(txn.getTransactionId())
                    .referenceId(txn.getReferenceId())
                    .senderUpi(txn.getSenderUpi())
                    .receiverUpi(txn.getReceiverUpi())
                    .amount(amount)
                    .currency("INR")
                    .status("SUCCESS")
                    .requestId(MDC.get(CorrelationIdFilter.MDC_KEY))
                    .build();

            paymentEventProducer.publishEvent(event);

            return response;

        } catch (Exception ex) {
            log.error("Payment execution failed, rolling back: {}", ex.getMessage());
            txn.setStatus("FAILED");
            txn.setFailureReason(ex.getMessage());
            txnRepo.save(txn);

            PaymentEvent event = PaymentEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType("PAYMENT_FAILED")
                    .transactionId(txn.getTransactionId())
                    .referenceId(txn.getReferenceId())
                    .senderUpi(txn.getSenderUpi())
                    .receiverUpi(txn.getReceiverUpi())
                    .amount(amount)
                    .currency("INR")
                    .status("FAILED")
                    .failureReason(ex.getMessage())
                    .requestId(MDC.get(CorrelationIdFilter.MDC_KEY))
                    .build();

            paymentEventProducer.publishEvent(event);
            throw new RuntimeException("Payment failed: " + ex.getMessage());
        }
    }

    @Transactional
    public Map<String, Object> sendMoney(PaymentRequest request, String authorizationHeader) {
        return sendMoney(request, authorizationHeader, null);
    }

    @Transactional
    public Map<String, Object> sendMoney(PaymentRequest request) {
        return sendMoney(request, null, null);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactions(String upiId, String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        if (!currentUser.getUpiId().equalsIgnoreCase(upiId)) {
            throw new RuntimeException("You are not allowed to access these transactions");
        }
        return txnRepo.findBySenderUpiOrReceiverUpiOrderByIdDesc(upiId, upiId);
    }

    @Transactional(readOnly = true)
    public List<Transaction> getTransactions(String upiId) {
        return txnRepo.findBySenderUpiOrReceiverUpiOrderByIdDesc(upiId, upiId);
    }

    @Transactional(readOnly = true)
    public PagedResponse<Transaction> getTransactionsPaged(
            User user,
            int page,
            int size,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            BigDecimal minAmount,
            BigDecimal maxAmount
    ) {
        String upiId = user.getUpiId();

        Specification<Transaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.or(
                    cb.equal(root.get("senderUpi"), upiId),
                    cb.equal(root.get("receiverUpi"), upiId)
            ));

            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate.atStartOfDay()));
            }

            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate.atTime(LocalTime.MAX)));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(cb.equal(cb.upper(root.get("status")), status.trim().toUpperCase()));
            }

            if (minAmount != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
            }

            if (maxAmount != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Transaction> txnPage = txnRepo.findAll(spec, pageable);

        return PagedResponse.from(txnPage);
    }

    @Transactional(readOnly = true)
    public PaymentReceiptResponse getReceipt(String transactionIdentifier, User currentUser) {
        Transaction txn = txnRepo.findByTransactionId(transactionIdentifier)
                .or(() -> txnRepo.findByReferenceId(transactionIdentifier))
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!txn.getSenderUpi().equalsIgnoreCase(currentUser.getUpiId()) &&
                !txn.getReceiverUpi().equalsIgnoreCase(currentUser.getUpiId())) {
            throw new RuntimeException("You are not authorized to view this receipt");
        }

        String senderName = userRepo.findByUpiId(txn.getSenderUpi()).map(User::getName).orElse(txn.getSenderUpi());
        String receiverName = userRepo.findByUpiId(txn.getReceiverUpi()).map(User::getName).orElse(txn.getReceiverUpi());

        return PaymentReceiptResponse.builder()
                .transactionId(txn.getTransactionId())
                .referenceId(txn.getReferenceId())
                .senderUpi(txn.getSenderUpi())
                .senderName(senderName)
                .receiverUpi(txn.getReceiverUpi())
                .receiverName(receiverName)
                .amount(txn.getAmount())
                .currency(txn.getCurrency())
                .status(txn.getStatus())
                .paymentMethod(txn.getPaymentMethod())
                .timestamp(txn.getCreatedAt())
                .failureReason(txn.getFailureReason())
                .build();
    }
}

