package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/transaction")
@RequiredArgsConstructor
public class TransactionController {

    private final PaymentService paymentService;

    @GetMapping("/{upiId}")
    public ApiResponse<List<Transaction>> getTransactions(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String upiId
    ) {
        return new ApiResponse<>(
                "SUCCESS",
                "Transactions fetched",
                paymentService.getTransactions(upiId, authorizationHeader)
        );
    }
}
