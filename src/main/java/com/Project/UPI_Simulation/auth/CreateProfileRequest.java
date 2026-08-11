package com.Project.UPI_Simulation.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CreateProfileRequest {
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    private String phoneNumber;
    @NotBlank(message = "Name is required")
    private String name;
    @Pattern(regexp = "\\d{4,6}", message = "PIN must contain 4 to 6 digits")
    private String pin;
    @Email(message = "Email address is invalid")
    private String email;
}
