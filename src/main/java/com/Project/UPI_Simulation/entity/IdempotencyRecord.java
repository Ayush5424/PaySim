package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "idempotency_records")
public class IdempotencyRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 128)
    private String idempotencyKey;

    private Long userId;

    @Column(nullable = false, length = 64)
    private String requestHash;

    @Column(nullable = false, length = 50)
    private String status; // PROCESSING, COMPLETED, FAILED

    @Lob
    @Column(columnDefinition = "TEXT")
    private String responseBody;

    private Integer httpStatus;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private Instant expiresAt;

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
