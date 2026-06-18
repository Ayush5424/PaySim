package com.Project.UPI_Simulation.auth;

import com.Project.UPI_Simulation.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/send-signup-otp")
    public String sendSignupOtp(@RequestBody SignupRequest request){
        return authService.sendSignupOtp(request);
    }

    @PostMapping("/verify-signup-otp")
    public String verifySignupOtp(@RequestBody VerifyOtpRequest request){
        return authService.verifySignupOtp(request);
    }

    @PostMapping("/create-profile")
    public User createProfile(@RequestBody CreateProfileRequest request){
        return authService.createProfile(request);
    }

    @PostMapping("/send-login-otp")
    public String sendLoginOtp(@RequestBody LoginRequest request){
        return authService.sendLoginOtp(request);
    }

    @PostMapping("/verify-login-otp")
    public String verifyLoginOtp(
            @RequestBody VerifyOtpRequest request
    ) {

        return authService.verifyLoginOtp(
                request
        );
    }
}
