package com.Project.UPI_Simulation.exception;

import org.springframework.http.HttpStatus;

public class InsufficientBalanceException extends AppException {

    public InsufficientBalanceException() {
        super(HttpStatus.UNPROCESSABLE_ENTITY, "INSUFFICIENT_BALANCE", "Insufficient balance");
    }
}
