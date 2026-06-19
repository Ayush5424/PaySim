package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;

    private String displayName;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String profilePhoto;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Column(unique = true, nullable = false)
    private String upiId;

    @Column(nullable = false)
    private String pin;

    @Column(nullable = false)
    private boolean verified;

}
