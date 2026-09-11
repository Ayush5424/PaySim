# Kafka Event-Driven Architecture

## Topics
- paysim-payment-events - Main payment events
- paysim-payment-dlq - Dead letter queue for failed events

## PaymentEvent Fields
- eventId, eventType (PAYMENT_SUCCEEDED/FAILED), transactionId, referenceId
- senderUpi, receiverUpi, amount, currency, status, requestId, timestamp

## Consumer
PaymentEventConsumer processes events asynchronously:
1. Logs PAYMENT_SENT audit event for sender
2. Logs PAYMENT_RECEIVED audit event for receiver
3. Creates notification for receiver
