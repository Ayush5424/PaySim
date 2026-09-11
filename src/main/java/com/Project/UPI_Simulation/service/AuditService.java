package com.Project.UPI_Simulation.service;

import com.Project.UPI_Simulation.config.CorrelationIdFilter;
import com.Project.UPI_Simulation.entity.AuditLog;
import com.Project.UPI_Simulation.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logEvent(Long userId, String eventType, String status, String metadata) {
        try {
            String requestId = MDC.get(CorrelationIdFilter.MDC_KEY);
            AuditLog auditLog = AuditLog.builder()
                    .eventId(UUID.randomUUID().toString())
                    .userId(userId)
                    .eventType(eventType)
                    .requestId(requestId)
                    .status(status)
                    .metadata(metadata)
                    .build();

            auditLogRepository.save(auditLog);
            log.info("Audit Event Logged: type={}, userId={}, status={}", eventType, userId, status);
        } catch (Exception ex) {
            log.error("Failed to save audit log: {}", ex.getMessage());
        }
    }
}
