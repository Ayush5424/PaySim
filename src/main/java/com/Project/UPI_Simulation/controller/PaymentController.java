package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.Project.UPI_Simulation.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/send")
    public ApiResponse<Map<String, Object>> sendMoney(@RequestBody PaymentRequest request){
        Map<String, Object> result = paymentService.sendMoney(request);
        return new ApiResponse<>("SUCCESS", "Payment Successful", result);
    }
}