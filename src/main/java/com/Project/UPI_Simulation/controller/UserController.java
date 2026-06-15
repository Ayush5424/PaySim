package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.PaymentService;
import com.Project.UPI_Simulation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final PaymentService paymentService;


    @PostMapping("/send")
    public ApiResponse<Map<String, Object>> sendMoney(@RequestBody PaymentRequest request) {
        Map<String, Object> result = paymentService.sendMoney(request);

        return new ApiResponse<>(
                "SUCCESS",
                "Payment Successful",
                result
        );
    }

    @PostMapping("/create")
    public ApiResponse<User> createUser(@RequestBody User user){
        return new ApiResponse<>(
                "SUCCESS",
                "User created",
                userService.createUser(user)
        );
    }


    @GetMapping("/balance/{upiId}")
    public ApiResponse<BigDecimal> getBalance(@PathVariable String upiId){
        return new ApiResponse<>(
                "SUCCESS",
                "Balance fetched",
                userService.getBalance(upiId)
        );

    }



    @GetMapping("/transactions/{upiId}")
    public ApiResponse<List<Transaction>> getTransactions(@PathVariable String upiId) {
        return new ApiResponse<>(
                "SUCCESS",
                "Transactions fetched",
                paymentService.getTransactions(upiId)
        );
    }

    @GetMapping("/phone/{phoneNumber}")
    public ApiResponse<User> getUserByPhone(@PathVariable String phoneNumber){
        return new ApiResponse<>("SUCCESS","User Foundeer", userService.getUserByPhone(phoneNumber));
    }
}