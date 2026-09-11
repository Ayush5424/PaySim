package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String transactionId;

    @Column(unique = true, nullable = false, length = 64)
    private String referenceId;

    @Column(nullable = false)
    private String senderUpi;

    @Column(nullable = false)
    private String receiverUpi;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String currency = "INR";

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String status = "INITIATED";

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String paymentMethod = "UPI_ID";

    @Column(length = 128)
    private String idempotencyKey;

    private String failureReason;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Transient
    public LocalDate getTimestamp() {
        return createdAt != null ? createdAt.toLocalDate() : LocalDate.now();
    }

    public void setTimestamp(LocalDate date) {
        if (date != null) {
            this.createdAt = date.atStartOfDay();
        }
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (currency == null) {
            currency = "INR";
        }
        if (status == null) {
            status = "INITIATED";
        }
        if (paymentMethod == null) {
            paymentMethod = "UPI_ID";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

