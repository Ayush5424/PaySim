package com.Project.UPI_Simulation.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentEvent {

    private String eventId;
    private String eventType; // PAYMENT_INITIATED, PAYMENT_SUCCEEDED, PAYMENT_FAILED, PAYMENT_REVERSED
    private String transactionId;
    private String referenceId;
    private String senderUpi;
    private String receiverUpi;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String failureReason;
    private String requestId;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
