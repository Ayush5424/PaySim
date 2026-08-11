package com.Project.UPI_Simulation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class BalanceRequest {
    @NotBlank(message = "UPI ID is required")
    private String upiId;
    @Pattern(regexp = "\\d{4,6}", message = "PIN must contain 4 to 6 digits")
    private String pin;
}
