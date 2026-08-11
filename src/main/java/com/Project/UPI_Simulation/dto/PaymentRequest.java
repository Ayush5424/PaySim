package com.Project.UPI_Simulation.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String fromUpi;
    @NotBlank(message = "Receiver UPI ID is required")
    private String toUpi;
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private BigDecimal amount;
    @Pattern(regexp = "\\d{4,6}", message = "PIN must contain 4 to 6 digits")
    private String pin;
}
