package com.Project.UPI_Simulation.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String fromUpi;
    private String toUpi;
    private BigDecimal amount;
    private String pin;
}
