-- V5: Create Idempotency Table
CREATE TABLE IF NOT EXISTS idempotency_records (
    id BIGSERIAL PRIMARY KEY,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    user_id BIGINT,
    request_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL,
    response_body TEXT,
    http_status INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);
