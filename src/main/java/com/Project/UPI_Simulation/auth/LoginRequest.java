package com.Project.UPI_Simulation.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    private String identifier; // Can be email, phone number, or UPI ID
    private String name;
    private String phoneNumber;
    private String password;
    private String pin;

    public String getEffectiveIdentifier() {
        if (identifier != null && !identifier.isBlank()) {
            return identifier.trim();
        }
        if (phoneNumber != null && !phoneNumber.isBlank()) {
            return phoneNumber.trim();
        }
        return name != null ? name.trim() : "";
    }

    public String getEffectiveSecret() {
        if (password != null && !password.isBlank()) {
            return password;
        }
        return pin != null ? pin : "";
    }
}

