package com.Project.UPI_Simulation.controller;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.entity.Notification;
import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.service.AuthSessionService;
import com.Project.UPI_Simulation.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/notifications", "/api/v1/notifications"})
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Internal notification center for payment and security events")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthSessionService authSessionService;

    @GetMapping
    @Operation(summary = "Get user notification center messages")
    public ApiResponse<List<Notification>> getNotifications(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        List<Notification> notifications = notificationService.getUserNotifications(currentUser);
        return new ApiResponse<>("SUCCESS", "Notifications fetched", notifications);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ApiResponse<Map<String, Object>> getUnreadCount(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        long count = notificationService.getUnreadCount(currentUser);
        return new ApiResponse<>("SUCCESS", "Unread count fetched", Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark single notification as read")
    public ApiResponse<String> markAsRead(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @PathVariable Long id
    ) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        notificationService.markAsRead(currentUser, id);
        return new ApiResponse<>("SUCCESS", "Notification marked as read", "OK");
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ApiResponse<String> markAllAsRead(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        User currentUser = authSessionService.requireUser(authorizationHeader);
        notificationService.markAllAsRead(currentUser);
        return new ApiResponse<>("SUCCESS", "All notifications marked as read", "OK");
    }
}
