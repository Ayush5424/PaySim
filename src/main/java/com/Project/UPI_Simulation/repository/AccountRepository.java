package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUser(User user);
    void deleteByUser(User user);
}
