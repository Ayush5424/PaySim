package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.QrPayloadResponse;
import com.Project.UPI_Simulation.service.QRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class QRController {

    private final QRService qrService;

    @GetMapping(
            value = "/qr/{upiId}",
            produces = MediaType.IMAGE_PNG_VALUE
    )
    public ResponseEntity<byte[]> generateQR(
            @PathVariable String upiId
    ) {

        byte[] qr = qrService.generateUserQR(upiId);

        return ResponseEntity.ok(qr);
    }

    @GetMapping("/qr/{upiId}/payload")
    public ApiResponse<QrPayloadResponse> getQrPayload(@PathVariable String upiId) {
        return new ApiResponse<>(
                "SUCCESS",
                "QR payload fetched",
                qrService.getUserQrDetails(upiId)
        );
    }
}
