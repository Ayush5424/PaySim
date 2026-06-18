package com.Project.UPI_Simulation.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class OtpService {

    private final Map<String, String> otpStore =
            new HashMap<>();

    private final Map<String, Boolean> verifiedPhones =
            new HashMap<>();

    public String generateOtp(
            String phoneNumber
    ) {

        String otp =
                String.format(
                        "%06d",
                        new Random().nextInt(1000000)
                );

        otpStore.put(
                phoneNumber,
                otp
        );

        System.out.println(
                "OTP for " +
                        phoneNumber +
                        " : " +
                        otp
        );

        return otp;
    }

    public boolean verifyOtp(
            String phoneNumber,
            String otp
    ) {

        String storedOtp =
                otpStore.get(phoneNumber);

        boolean verified =
                storedOtp != null &&
                        storedOtp.equals(otp);

        if (verified) {

            verifiedPhones.put(
                    phoneNumber,
                    true
            );
        }

        return verified;
    }

    public boolean isPhoneVerified(
            String phoneNumber
    ) {

        return verifiedPhones.getOrDefault(
                phoneNumber,
                false
        );
    }

    public void clearOtp(
            String phoneNumber
    ) {

        otpStore.remove(
                phoneNumber
        );
    }

    public void clearVerification(
            String phoneNumber
    ) {

        verifiedPhones.remove(
                phoneNumber
        );
    }
}