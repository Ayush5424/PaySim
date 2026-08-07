package com.Project.UPI_Simulation.auth;

import lombok.Data;

@Data
public class CreateProfileRequest {
    private String phoneNumber;
    private String name;
    private String pin;
    private String email;
}
