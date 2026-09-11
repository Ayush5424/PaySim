package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUpiId(String upiId);

    Optional<User> findByPhoneNumber(String phoneNumber);

    Optional<User> findByNameAndPhoneNumber(String name, String phoneNumber);

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.phoneNumber = :identifier OR u.upiId = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByEmail(String email);

    boolean existsByUpiId(String upiId);
}

