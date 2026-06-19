package com.Project.UPI_Simulation.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class QrPayloadResponse {
    private String upiId;
    private String name;
    private String payload;
}
