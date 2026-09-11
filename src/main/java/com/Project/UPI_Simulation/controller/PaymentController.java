package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.PaymentReceiptResponse;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.AuthSessionService;
import com.Project.UPI_Simulation.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/api/payment", "/api/v1/payments", "/api/v1/payment"})
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Transactional UPI payment execution, idempotency, and receipts")
public class PaymentController {

    private final PaymentService paymentService;
    private final AuthSessionService authSessionService;

    @PostMapping("/send")
    @Operation(summary = "Send money to another user via UPI ID with concurrency lock & idempotency check")
    public ApiResponse<Map<String, Object>> sendMoney(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody PaymentRequest request
    ) {
        Map<String, Object> result = paymentService.sendMoney(request, authorizationHeader, idempotencyKey);
        return new ApiResponse<>("SUCCESS", "Payment Successful", result);
    }

    @GetMapping("/receipt/{transactionId}")
    @Operation(summary = "Get detailed payment receipt for a transaction")
    public ApiResponse<PaymentReceiptResponse> getReceipt(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable String transactionId
    ) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        PaymentReceiptResponse receipt = paymentService.getReceipt(transactionId, currentUser);
        return new ApiResponse<>("SUCCESS", "Receipt fetched successfully", receipt);
    }
}

