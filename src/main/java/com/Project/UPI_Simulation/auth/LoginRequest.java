package com.Project.UPI_Simulation.auth;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {
    private String name;
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    private String phoneNumber;
}
