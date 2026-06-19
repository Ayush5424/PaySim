package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.repository.UserRepository;
import com.Project.UPI_Simulation.repository.AccountRepository;
import com.Project.UPI_Simulation.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;

import java.math.BigDecimal;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final OtpService otpService;

    public String sendSignupOtp(SignupRequest request){
        if(userRepository.findByPhoneNumber(request.getPhoneNumber()).isPresent()){
            throw new RuntimeException("Phone number already registered");
        }
        otpService.generateOtp(request.getPhoneNumber());
        return "OTP sent successfully";
    }
    public String verifySignupOtp(
            VerifyOtpRequest request
    ) {

        boolean verified =
                otpService.verifyOtp(
                        request.getPhoneNumber(),
                        request.getOtp()
                );

        if (!verified) {

            throw new RuntimeException(
                    "Invalid OTP"
            );
        }

        otpService.clearOtp(
                request.getPhoneNumber()
        );

        return "OTP verified successfully";
    }

    @Transactional
    public User createProfile(CreateProfileRequest request){
        if(!otpService.isPhoneVerified(request.getPhoneNumber())){
            throw new RuntimeException("Phone number not verified");
        }

        User user = new User();

        user.setName(request.getName());
        user.setDisplayName(request.getName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPin(request.getPin());
        user.setVerified(
                true
        );

        String upiId =
                request.getName()
                        .toLowerCase()
                        .replaceAll("\\s+", "")
                        +
                        (1000 + new Random().nextInt(9000))
                        +
                        "@upi";

        user.setUpiId(
                upiId
        );

        User savedUser =
                userRepository.save(user);

        Account account = new Account();
        account.setUser(savedUser);
        account.setAccountNumber(UUID.randomUUID().toString());
        account.setBalance(BigDecimal.ZERO);
        account.setPin(request.getPin());

        accountRepository.save(account);

        otpService.clearVerification(
                request.getPhoneNumber()
        );

        return savedUser;

    }

    public String sendLoginOtp(LoginRequest request){
        userRepository.findByNameAndPhoneNumber(request.getName(), request.getPhoneNumber()).orElseThrow(() -> new RuntimeException("User not found"));

        otpService.generateOtp(request.getPhoneNumber());

        return "Login OTP sent successfully";
    }

    public String verifyLoginOtp(
            VerifyOtpRequest request
    ) {

        boolean verified =
                otpService.verifyOtp(
                        request.getPhoneNumber(),
                        request.getOtp()
                );

        if (!verified) {

            throw new RuntimeException(
                    "Invalid OTP"
            );
        }

        otpService.clearOtp(
                request.getPhoneNumber()
        );

        return "Login successful";
    }

}
