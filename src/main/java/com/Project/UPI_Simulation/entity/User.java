package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
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

    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    @Column(unique = true, nullable = false, length = 10)
    private String phoneNumber;

    @Email(message = "Email address is invalid")
    @Column(unique = true)
    private String email;

    @Column(unique = true, nullable = false)
    private String upiId;

    @Pattern(regexp = "\\d{4,6}", message = "PIN must contain 4 to 6 digits")
    @Column(nullable = false)
    private String pin;

    @Column(nullable = false)
    private boolean verified;

}
