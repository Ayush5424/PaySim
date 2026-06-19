package com.Project.UPI_Simulation.dto;

import lombok.Data;

@Data
public class BalanceRequest {
    private String upiId;
    private String pin;
}
