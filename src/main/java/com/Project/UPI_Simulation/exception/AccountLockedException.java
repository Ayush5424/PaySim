package com.Project.UPI_Simulation.exception;

import org.springframework.http.HttpStatus;

public class AccountLockedException extends AppException {

    public AccountLockedException() {
        super(HttpStatus.FORBIDDEN, "ACCOUNT_LOCKED", "Account is temporarily locked due to too many failed login attempts");
    }
}
