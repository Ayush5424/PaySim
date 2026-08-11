package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.AuthSession;
import com.Project.UPI_Simulation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByTokenHash(String tokenHash);
    void deleteByTokenHash(String tokenHash);
    void deleteByUser(User user);
    void deleteByExpiresAtBefore(Instant now);
}
