package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.QrPayloadResponse;
import com.Project.UPI_Simulation.service.QRService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/payment", "/api/v1/payments", "/api/v1/payment"})
@RequiredArgsConstructor
@Tag(name = "QR Code", description = "UPI QR Code generation and payload decoding")
public class QRController {

    private final QRService qrService;

    @GetMapping(
            value = "/qr/{upiId}",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    @Operation(summary = "Generate PNG QR code image for user UPI ID")
    public ResponseEntity<byte[]> generateQR(@PathVariable String upiId) {
        byte[] qr = qrService.generateUserQR(upiId);
        return ResponseEntity.ok(qr);
    }

    @GetMapping("/qr/{upiId}/payload")
    @Operation(summary = "Get parsed UPI payment payload details for QR code")
    public ApiResponse<QrPayloadResponse> getQrPayload(@PathVariable String upiId) {
        return new ApiResponse<>(
                "SUCCESS",
                "QR payload fetched",
                qrService.getUserQrDetails(upiId)
        );
    }
}

