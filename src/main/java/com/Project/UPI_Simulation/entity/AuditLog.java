package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 64)
    private String eventId;

    private Long userId;

    @Column(nullable = false, length = 100)
    private String eventType; // LOGIN_SUCCESS, LOGIN_FAILED, PASSWORD_CHANGE, PAYMENT_INITIATED, etc.

    @Column(length = 64)
    private String requestId;

    @Column(length = 100)
    private String ipAddress;

    @Column(nullable = false, length = 50)
    private String status; // SUCCESS, FAILED

    @Lob
    @Column(columnDefinition = "TEXT")
    private String metadata;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
