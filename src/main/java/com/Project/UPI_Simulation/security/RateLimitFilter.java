package com.Project.UPI_Simulation.security;

import com.Project.UPI_Simulation.dto.ApiResponse;
import com.Project.UPI_Simulation.service.RateLimitingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final RateLimitingService rateLimitingService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimitingService rateLimitingService, @org.springframework.beans.factory.annotation.Autowired(required = false) ObjectMapper objectMapper) {
        this.rateLimitingService = rateLimitingService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIp(request);

        String rateLimitType = null;
        if (path.startsWith("/api/auth") || path.startsWith("/api/v1/auth")) {
            rateLimitType = "auth";
        } else if (path.startsWith("/api/payment") || path.startsWith("/api/v1/payments") || path.startsWith("/api/v1/payment")) {
            rateLimitType = "payment";
        }

        if (rateLimitType != null && !rateLimitingService.isAllowed(clientIp, rateLimitType)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            ApiResponse<Void> apiResponse = new ApiResponse<>("FAILED", "Too many requests. Please try again later.", null);
            response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
