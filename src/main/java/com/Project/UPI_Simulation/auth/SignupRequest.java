package com.Project.UPI_Simulation.auth;

import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SignupRequest {
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    private String phoneNumber;
    private String name;
    private String pin;
}
