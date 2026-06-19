package com.Project.UPI_Simulation.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String name;
    private String displayName;
    private String profilePhoto;
}
