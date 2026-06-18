package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUpiId(String upiId);
    Optional<User> findByPhoneNumber(String phoneNumber);
    Optional<User> findByNameAndPhoneNumber(String name, String phonenNumber);

}
