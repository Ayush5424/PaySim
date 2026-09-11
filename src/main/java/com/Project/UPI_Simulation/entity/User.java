package com.Project.UPI_Simulation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
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
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String displayName;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String profilePhoto;

    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    @Column(unique = true, nullable = false, length = 15)
    private String phoneNumber;

    @Email(message = "Email address is invalid")
    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String passwordHash;

    @JsonIgnore
    @Column(nullable = false)
    private String pinHash;

    @Column(unique = true, nullable = false)
    private String upiId;

    @Builder.Default
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Builder.Default
    @Column(nullable = false)
    private int failedLoginAttempts = 0;

    private LocalDateTime lockUntil;

    @Builder.Default
    @Column(nullable = false)
    private boolean verified = true;

    @Builder.Default
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Transient
    private String pin;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "ACTIVE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isAccountLocked() {
        if (lockUntil == null) {
            return "LOCKED".equalsIgnoreCase(status);
        }
        return lockUntil.isAfter(LocalDateTime.now());
    }
}

