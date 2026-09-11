package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.PagedResponse;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.AuthSessionService;
import com.Project.UPI_Simulation.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/api/transaction", "/api/v1/transactions", "/api/v1/transaction"})
@RequiredArgsConstructor
@Tag(name = "Transactions", description = "Transaction history, search, filtering, and receipts")
public class TransactionController {

    private final PaymentService paymentService;
    private final AuthSessionService authSessionService;

    @GetMapping
    @Operation(summary = "Get paginated transaction history with filtering for authenticated user")
    public ApiResponse<PagedResponse<Transaction>> getMyTransactionsPaged(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount
    ) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        PagedResponse<Transaction> paged = paymentService.getTransactionsPaged(
                currentUser, page, size, startDate, endDate, status, minAmount, maxAmount
        );
        return new ApiResponse<>("SUCCESS", "Transactions fetched", paged);
    }

    @GetMapping("/{upiId}")
    @Operation(summary = "Get transaction history by UPI ID")
    public ApiResponse<List<Transaction>> getTransactions(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable String upiId
    ) {
        return new ApiResponse<>(
                "SUCCESS",
                "Transactions fetched",
                paymentService.getTransactions(upiId, authorizationHeader)
        );
    }
}

