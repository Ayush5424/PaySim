# Database Schema

## Tables
- users - Core user profiles
- accounts - Bank accounts (balance, version)
- transactions - Payment records
- auth_sessions - Active login sessions
- refresh_tokens - JWT refresh tokens
- idempotency_records - Idempotency key cache
- notifications - User notifications
- audit_logs - Immutable audit trail

## Migrations (Flyway)
- V1__create_users_table.sql
- V2__create_accounts_table.sql
- V3__create_transactions_table.sql
- V4__create_auth_sessions_table.sql
- V5__create_refresh_tokens_and_idempotency.sql
- V6__create_notifications_table.sql
- V7__create_audit_logs_table.sql
