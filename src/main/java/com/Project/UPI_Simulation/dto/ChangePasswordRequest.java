package com.Project.UPI_Simulation.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    @NotBlank(message = "Current password or PIN is required")
    private String currentPassword;

    @NotBlank(message = "New password or PIN is required")
    private String newPassword;
}
