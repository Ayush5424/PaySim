package com.Project.UPI_Simulation.event;

import com.Project.UPI_Simulation.entity.User;
import com.Project.UPI_Simulation.repository.UserRepository;
import com.Project.UPI_Simulation.service.AuditService;
import com.Project.UPI_Simulation.service.NotificationService;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class PaymentEventConsumer {

    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditService auditService;
    private final Counter paymentSuccessCounter;
    private final Counter paymentFailureCounter;

    public PaymentEventConsumer(
            UserRepository userRepository,
            NotificationService notificationService,
            AuditService auditService,
            Optional<MeterRegistry> meterRegistry
    ) {
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.auditService = auditService;
        
        if (meterRegistry.isPresent()) {
            this.paymentSuccessCounter = meterRegistry.get().counter("paysim.payments.success.count");
            this.paymentFailureCounter = meterRegistry.get().counter("paysim.payments.failure.count");
        } else {
            this.paymentSuccessCounter = null;
            this.paymentFailureCounter = null;
        }
    }

    @KafkaListener(
            topics = "${app.kafka.topics.payment-events:paysim-payment-events}",
            groupId = "${spring.kafka.consumer.group-id:paysim-group}",
            autoStartup = "${spring.kafka.enabled:false}"
    )
    public void consumePaymentEvent(PaymentEvent event) {
        log.info("Kafka consumer received event: type={}, transactionId={}", event.getEventType(), event.getTransactionId());
        handlePaymentEventDirectly(event);
    }

    public void handlePaymentEventDirectly(PaymentEvent event) {
        log.info("Processing payment event asynchronously: type={}, transactionId={}", event.getEventType(), event.getTransactionId());

        if ("PAYMENT_SUCCEEDED".equalsIgnoreCase(event.getEventType())) {
            if (paymentSuccessCounter != null) {
                paymentSuccessCounter.increment();
            }

            // Sender Notification
            userRepository.findByUpiId(event.getSenderUpi()).ifPresent(sender -> {
                notificationService.createNotification(
                        sender,
                        "Money Sent",
                        "You sent ₹" + event.getAmount() + " to " + event.getReceiverUpi() + ". Txn Ref: " + event.getReferenceId(),
                        "PAYMENT_SENT",
                        event.getReferenceId()
                );
                auditService.logEvent(sender.getId(), "PAYMENT_SENT", "SUCCESS", "Amount: ₹" + event.getAmount() + " to " + event.getReceiverUpi());
            });

            // Receiver Notification
            userRepository.findByUpiId(event.getReceiverUpi()).ifPresent(receiver -> {
                notificationService.createNotification(
                        receiver,
                        "Money Received",
                        "You received ₹" + event.getAmount() + " from " + event.getSenderUpi() + ". Txn Ref: " + event.getReferenceId(),
                        "PAYMENT_RECEIVED",
                        event.getReferenceId()
                );
                auditService.logEvent(receiver.getId(), "PAYMENT_RECEIVED", "SUCCESS", "Amount: ₹" + event.getAmount() + " from " + event.getSenderUpi());
            });

        } else if ("PAYMENT_FAILED".equalsIgnoreCase(event.getEventType())) {
            if (paymentFailureCounter != null) {
                paymentFailureCounter.increment();
            }

            userRepository.findByUpiId(event.getSenderUpi()).ifPresent(sender -> {
                notificationService.createNotification(
                        sender,
                        "Payment Failed",
                        "Your payment of ₹" + event.getAmount() + " to " + event.getReceiverUpi() + " failed: " + event.getFailureReason(),
                        "PAYMENT_FAILED",
                        event.getReferenceId()
                );
                auditService.logEvent(sender.getId(), "PAYMENT_FAILED", "FAILED", event.getFailureReason());
            });
        }
    }
}
