package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.auth.CreateProfileRequest;
import com.Project.UPI_Simulation.dto.PaymentRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
public class PaymentControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;
    private String user1Token;
    private String user1Upi;
    private String user2Upi;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        String phone1 = "98" + (10000000 + (int)(Math.random() * 89999999));
        String phone2 = "99" + (10000000 + (int)(Math.random() * 89999999));

        // Create User 1
        CreateProfileRequest req1 = CreateProfileRequest.builder()
                .name("Integration User 1")
                .phoneNumber(phone1)
                .email("user1_" + System.currentTimeMillis() + "@test.com")
                .pin("1234")
                .password("Password123!")
                .initialBalance(new BigDecimal("5000.00"))
                .build();

        MvcResult res1 = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> body1 = objectMapper.readValue(res1.getResponse().getContentAsString(), Map.class);
        user1Token = (String) body1.get("accessToken");
        Map<?, ?> userInfo1 = (Map<?, ?>) body1.get("user");
        user1Upi = (String) userInfo1.get("upiId");

        // Create User 2
        CreateProfileRequest req2 = CreateProfileRequest.builder()
                .name("Integration User 2")
                .phoneNumber(phone2)
                .email("user2_" + System.currentTimeMillis() + "@test.com")
                .pin("5678")
                .password("Password123!")
                .initialBalance(new BigDecimal("1000.00"))
                .build();

        MvcResult res2 = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andReturn();

        Map<?, ?> body2 = objectMapper.readValue(res2.getResponse().getContentAsString(), Map.class);
        Map<?, ?> userInfo2 = (Map<?, ?>) body2.get("user");
        user2Upi = (String) userInfo2.get("upiId");
    }

    @Test
    @DisplayName("Complete end-to-end payment flow: login, send money, fetch receipt, check transactions & notifications")
    void testEndToEndPaymentFlow() throws Exception {
        // 1. Send Money
        PaymentRequest paymentReq = PaymentRequest.builder()
                .fromUpi(user1Upi)
                .toUpi(user2Upi)
                .amount(new BigDecimal("500.00"))
                .pin("1234")
                .build();

        String idempotencyKey = "INTEG-" + UUID.randomUUID();

        MvcResult payResult = mockMvc.perform(post("/api/v1/payments/send")
                        .header("Authorization", "Bearer " + user1Token)
                        .header("Idempotency-Key", idempotencyKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.transactionId").exists())
                .andReturn();

        Map<?, ?> payResponseBody = objectMapper.readValue(payResult.getResponse().getContentAsString(), Map.class);
        Map<?, ?> dataMap = (Map<?, ?>) payResponseBody.get("data");
        String transactionId = (String) dataMap.get("transactionId");

        // 2. Fetch Receipt
        mockMvc.perform(get("/api/v1/payments/receipt/" + transactionId)
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.transactionId").value(transactionId))
                .andExpect(jsonPath("$.data.senderUpi").value(user1Upi))
                .andExpect(jsonPath("$.data.receiverUpi").value(user2Upi))
                .andExpect(jsonPath("$.data.amount").value(500.0));

        // 3. Fetch Paginated Transactions
        mockMvc.perform(get("/api/v1/transactions?page=0&size=10")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        // 4. Fetch User Notifications
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + user1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));
    }
}
