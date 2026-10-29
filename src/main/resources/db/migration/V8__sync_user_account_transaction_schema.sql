-- V8: Sync User, Account, and Transaction tables with JPA entity definitions
-- Preserves existing data, generates BCrypt hashes for existing plaintext PINs, and adds missing columns

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. FIX USERS TABLE
-- ============================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Ensure verified has default true
ALTER TABLE users ALTER COLUMN verified SET DEFAULT true;
UPDATE users SET verified = true WHERE verified IS NULL;

-- Populate pin_hash and password_hash for existing records using bcrypt from existing pin
UPDATE users 
SET pin_hash = crypt(pin, gen_salt('bf', 10)) 
WHERE (pin_hash IS NULL OR pin_hash = '') AND pin IS NOT NULL AND pin <> '';

-- For any users still missing pin_hash, use default fallback pin '1234'
UPDATE users 
SET pin_hash = crypt('1234', gen_salt('bf', 10)) 
WHERE pin_hash IS NULL OR pin_hash = '';

-- Also populate password_hash for existing users if null so they can authenticate
UPDATE users 
SET password_hash = pin_hash 
WHERE password_hash IS NULL OR password_hash = '';

-- Ensure status, failed_login_attempts and timestamps are populated
UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;
UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Enforce constraints
ALTER TABLE users ALTER COLUMN pin_hash SET NOT NULL;
ALTER TABLE users ALTER COLUMN status SET NOT NULL;
ALTER TABLE users ALTER COLUMN failed_login_attempts SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE users ALTER COLUMN updated_at SET NOT NULL;

-- ============================================================================
-- 2. FIX ACCOUNTS TABLE
-- ============================================================================
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Version default and non-null
ALTER TABLE accounts ALTER COLUMN version SET DEFAULT 0;
UPDATE accounts SET version = 0 WHERE version IS NULL;
ALTER TABLE accounts ALTER COLUMN version SET NOT NULL;

-- Populate pin_hash in accounts for existing rows
UPDATE accounts 
SET pin_hash = crypt(pin, gen_salt('bf', 10)) 
WHERE (pin_hash IS NULL OR pin_hash = '') AND pin IS NOT NULL AND pin <> '';

-- Sync pin_hash from users table if accounts.pin_hash is still null
UPDATE accounts a 
SET pin_hash = u.pin_hash 
FROM users u 
WHERE a.user_id = u.id AND (a.pin_hash IS NULL OR a.pin_hash = '');

-- Populate currency, status, timestamps for existing rows
UPDATE accounts SET currency = 'INR' WHERE currency IS NULL;
UPDATE accounts SET status = 'ACTIVE' WHERE status IS NULL;
UPDATE accounts SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;
UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- ============================================================================
-- 3. FIX TRANSACTIONS TABLE
-- ============================================================================
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS reference_id VARCHAR(64);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI_ID';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Populate existing transactions
UPDATE transactions 
SET transaction_id = md5(random()::text || clock_timestamp()::text) 
WHERE transaction_id IS NULL OR transaction_id = '';

UPDATE transactions 
SET reference_id = 'REF' || id || to_char(COALESCE(timestamp, CURRENT_DATE), 'YYYYMMDD') 
WHERE reference_id IS NULL OR reference_id = '';

UPDATE transactions 
SET created_at = COALESCE(timestamp::timestamp, CURRENT_TIMESTAMP) 
WHERE created_at IS NULL;

UPDATE transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

UPDATE transactions SET currency = 'INR' WHERE currency IS NULL;
UPDATE transactions SET payment_method = 'UPI_ID' WHERE payment_method IS NULL;
UPDATE transactions SET status = 'SUCCESS' WHERE status IS NULL;

-- Set NOT NULL and UNIQUE on reference_id & transaction_id
ALTER TABLE transactions ALTER COLUMN reference_id SET NOT NULL;
ALTER TABLE transactions ALTER COLUMN transaction_id SET NOT NULL;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_reference_id_key') THEN
        ALTER TABLE transactions ADD CONSTRAINT transactions_reference_id_key UNIQUE (reference_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_transaction_id_key') THEN
        ALTER TABLE transactions ADD CONSTRAINT transactions_transaction_id_key UNIQUE (transaction_id);
    END IF;
END $$;
