package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findBySenderUpiOrReceiverUpi(String sender, String receiver);
}
