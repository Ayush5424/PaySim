package com.Project.UPI_Simulation.dto;

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
public class PaymentReceiptResponse {

    private String transactionId;
    private String referenceId;
    private String senderUpi;
    private String senderName;
    private String receiverUpi;
    private String receiverName;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String paymentMethod;
    private LocalDateTime timestamp;
    private String failureReason;
}
