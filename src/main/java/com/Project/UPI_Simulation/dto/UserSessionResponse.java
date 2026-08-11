package com.Project.UPI_Simulation.dto;

import com.Project.UPI_Simulation.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSessionResponse {
    private String name;
    private String displayName;
    private String phoneNumber;
    private String email;
    private String upiId;
    private String profilePhoto;
    private boolean verified;

    public static UserSessionResponse from(User user) {
        return new UserSessionResponse(
                user.getName(),
                user.getDisplayName(),
                user.getPhoneNumber(),
                user.getEmail(),
                user.getUpiId(),
                user.getProfilePhoto(),
                user.isVerified()
        );
    }
}
