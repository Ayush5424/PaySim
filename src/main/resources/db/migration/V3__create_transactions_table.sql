-- V3: Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id VARCHAR(64) UNIQUE NOT NULL,
    reference_id VARCHAR(64) UNIQUE NOT NULL,
    sender_upi VARCHAR(255) NOT NULL,
    receiver_upi VARCHAR(255) NOT NULL,
    amount DECIMAL(19, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI_ID',
    idempotency_key VARCHAR(128),
    failure_reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
