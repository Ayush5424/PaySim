package com.Project.UPI_Simulation.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "transactions")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String senderUpi;
    private String receiverUpi;

    private BigDecimal amount;

    private String status;

    private LocalDate timestamp;

    private String transactionId;

    private String failureReason;

}
