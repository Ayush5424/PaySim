package com.Project.UPI_Simulation.auth;

import lombok.Data;

@Data
public class LoginRequest {
    private String name;
    private String phoneNumber;
}
