package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.BalanceRequest;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.dto.ProfileUpdateRequest;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.PaymentService;
import com.Project.UPI_Simulation.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;
    private final PaymentService paymentService;


    @PostMapping("/send")
    public ApiResponse<Map<String, Object>> sendMoney(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody PaymentRequest request
    ) {
        Map<String, Object> result = paymentService.sendMoney(request, authorizationHeader);

        return new ApiResponse<>(
                "SUCCESS",
                "Payment Successful",
                result
        );
    }

    @PostMapping("/create")
    public ApiResponse<User> createUser(@Valid @RequestBody User user){
        return new ApiResponse<>(
                "SUCCESS",
                "User created",
                userService.createUser(user)
        );
    }


    @GetMapping("/balance/{upiId}")
    public ApiResponse<BigDecimal> getBalance(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String upiId
    ){
        User currentUser = userService.getCurrentUser(authorizationHeader);
        userService.requireSameUpi(currentUser, upiId);
        return new ApiResponse<>(
                "SUCCESS",
                "Balance fetched",
                userService.getBalance(upiId)
        );

    }

    @PostMapping("/balance")
    public ApiResponse<BigDecimal> getBalanceWithPin(
            @RequestHeader("Authorization") String authorizationHeader,
            @Valid @RequestBody BalanceRequest request
    ){
        return new ApiResponse<>(
                "SUCCESS",
                "Balance fetched",
                userService.getBalanceForCurrentUser(request.getUpiId(), request.getPin(), authorizationHeader)
        );
    }



    @GetMapping("/transactions/{upiId}")
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

    @GetMapping("/phone/{phoneNumber}")
    public ApiResponse<User> getUserByPhone(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber
    ){
        return new ApiResponse<>("SUCCESS","User Found", userService.getUserByPhoneForCurrentUser(phoneNumber, authorizationHeader));
    }

    @PutMapping("/profile/{phoneNumber}")
    public ApiResponse<User> updateProfile(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber,
            @RequestBody ProfileUpdateRequest request
    ){
        return new ApiResponse<>(
                "SUCCESS",
                "Profile updated",
                userService.updateProfile(phoneNumber, request, authorizationHeader)
        );
    }

    @DeleteMapping("/profile/{phoneNumber}/photo")
    public ApiResponse<User> removeProfilePhoto(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber
    ){
        return new ApiResponse<>(
                "SUCCESS",
                "Profile photo removed",
                userService.removeProfilePhoto(phoneNumber, authorizationHeader)
        );
    }

    @DeleteMapping("/account")
    public ApiResponse<Void> deleteAccount(@RequestHeader("Authorization") String authorizationHeader) {
        userService.deleteCurrentAccount(authorizationHeader);
        return new ApiResponse<>("SUCCESS", "Account deleted successfully", null);
    }
}
