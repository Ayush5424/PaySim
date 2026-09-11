# Payment Flow

## UPI Send Money - Step by Step

1. **Client** sends POST /api/v1/payments/send with Bearer token and Idempotency-Key header.
2. **JwtAuthenticationFilter** validates the JWT; sets Spring SecurityContext.
3. **RateLimitFilter** checks per-user payment rate limit.
4. **PaymentController** delegates to PaymentService.sendMoney().
5. **Idempotency Check**: Checks Redis cache, then DB. If COMPLETED returns cached response. If PROCESSING returns 409.
6. **User Validation**: Resolves sender/receiver from UPI IDs; checks ACTIVE status.
7. **Pessimistic Row Locking**: Acquires SELECT FOR UPDATE on both accounts in ascending ID order.
8. **PIN Verification**: Matches PIN against bcrypt hash.
9. **Balance Check**: Validates sufficient funds.
10. **Atomic Balance Update**: Deducts from sender, credits receiver.
11. **Transaction persisted**: INITIATED to PROCESSING to SUCCESS.
12. **Idempotency record saved** with serialized response body.
13. **Kafka Event published**: PAYMENT_SUCCEEDED to topic paysim-payment-events.
14. **Kafka Consumer** (async): logs audit events, creates notification.
15. **Response**: ApiResponse with transactionId, referenceId, amount, status SUCCESS.
