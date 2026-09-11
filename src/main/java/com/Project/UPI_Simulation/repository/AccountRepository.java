package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.Account;
import com.Project.UPI_Simulation.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByUser(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.id = :id")
    Optional<Account> findByIdWithLock(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.user.id = :userId")
    Optional<Account> findByUserIdWithLock(@Param("userId") Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Account a WHERE a.user.upiId = :upiId")
    Optional<Account> findByUserUpiIdWithLock(@Param("upiId") String upiId);

    @Query("SELECT a.id FROM Account a WHERE a.user.id = :userId")
    Optional<Long> findAccountIdByUserId(@Param("userId") Long userId);

    void deleteByUser(User user);
}

