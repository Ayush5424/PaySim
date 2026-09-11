package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.BalanceRequest;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.dto.ProfileUpdateRequest;
import com.Project.UPI_Simulation.entity.Transaction;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.PaymentService;
import com.Project.UPI_Simulation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/user", "/api/v1/users", "/api/v1/user"})
@RequiredArgsConstructor
@Validated
@Tag(name = "Users & Accounts", description = "User profile, balance inquiry, and account settings")
public class UserController {

    private final UserService userService;
    private final PaymentService paymentService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ApiResponse<User> getMe(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        return new ApiResponse<>("SUCCESS", "User profile fetched", userService.getCurrentUser(authorizationHeader));
    }

    @PostMapping("/send")
    @Operation(summary = "Send money (user alias)")
    public ApiResponse<Map<String, Object>> sendMoney(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody PaymentRequest request
    ) {
        Map<String, Object> result = paymentService.sendMoney(request, authorizationHeader);
        return new ApiResponse<>("SUCCESS", "Payment Successful", result);
    }

    @PostMapping("/create")
    @Operation(summary = "Create user account")
    public ApiResponse<User> createUser(@Valid @RequestBody User user) {
        return new ApiResponse<>("SUCCESS", "User created", userService.createUser(user));
    }

    @GetMapping("/balance/{upiId}")
    @Operation(summary = "Get balance for UPI ID")
    public ApiResponse<BigDecimal> getBalance(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable String upiId
    ) {
        User currentUser = userService.getCurrentUser(authorizationHeader);
        userService.requireSameUpi(currentUser, upiId);
        return new ApiResponse<>("SUCCESS", "Balance fetched", userService.getBalance(upiId));
    }

    @PostMapping("/balance")
    @Operation(summary = "Get balance with PIN verification")
    public ApiResponse<BigDecimal> getBalanceWithPin(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @Valid @RequestBody BalanceRequest request
    ) {
        return new ApiResponse<>(
                "SUCCESS",
                "Balance fetched",
                userService.getBalanceForCurrentUser(request.getUpiId(), request.getPin(), authorizationHeader)
        );
    }

    @GetMapping("/transactions/{upiId}")
    @Operation(summary = "Get transactions for user")
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

    @GetMapping("/phone/{phoneNumber}")
    @Operation(summary = "Search user by phone number")
    public ApiResponse<User> getUserByPhone(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber
    ) {
        return new ApiResponse<>("SUCCESS", "User Found", userService.getUserByPhoneForCurrentUser(phoneNumber, authorizationHeader));
    }

    @PutMapping("/profile/{phoneNumber}")
    @Operation(summary = "Update user profile details")
    public ApiResponse<User> updateProfile(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber,
            @RequestBody ProfileUpdateRequest request
    ) {
        return new ApiResponse<>(
                "SUCCESS",
                "Profile updated",
                userService.updateProfile(phoneNumber, request, authorizationHeader)
        );
    }

    @DeleteMapping("/profile/{phoneNumber}/photo")
    @Operation(summary = "Remove user profile photo")
    public ApiResponse<User> removeProfilePhoto(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits") String phoneNumber
    ) {
        return new ApiResponse<>(
                "SUCCESS",
                "Profile photo removed",
                userService.removeProfilePhoto(phoneNumber, authorizationHeader)
        );
    }

    @DeleteMapping("/account")
    @Operation(summary = "Delete user account permanently")
    public ApiResponse<Void> deleteAccount(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        userService.deleteCurrentAccount(authorizationHeader);
        return new ApiResponse<>("SUCCESS", "Account deleted successfully", null);
    }
}

