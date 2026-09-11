package com.Project.UPI_Simulation.repository;

import com.Project.UPI_Simulation.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findBySenderUpiOrReceiverUpi(String sender, String receiver);

    List<Transaction> findBySenderUpiOrReceiverUpiOrderByIdDesc(String sender, String receiver);

    Page<Transaction> findBySenderUpiOrReceiverUpi(String sender, String receiver, Pageable pageable);

    Optional<Transaction> findByTransactionId(String transactionId);

    Optional<Transaction> findByReferenceId(String referenceId);

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
}

