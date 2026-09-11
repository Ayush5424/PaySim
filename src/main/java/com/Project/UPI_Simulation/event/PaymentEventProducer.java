package com.Project.UPI_Simulation.event;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class PaymentEventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final String topicName;
    private final PaymentEventConsumer fallbackConsumer;

    @Autowired
    public PaymentEventProducer(
            @Autowired(required = false) KafkaTemplate<String, Object> kafkaTemplate,
            @Value("${app.kafka.topics.payment-events:paysim-payment-events}") String topicName,
            PaymentEventConsumer fallbackConsumer
    ) {
        this.kafkaTemplate = kafkaTemplate;
        this.topicName = topicName;
        this.fallbackConsumer = fallbackConsumer;
    }

    public void publishEvent(PaymentEvent event) {
        log.info("Publishing payment event: type={}, transactionId={}", event.getEventType(), event.getTransactionId());

        boolean publishedToKafka = false;
        if (kafkaTemplate != null) {
            try {
                kafkaTemplate.send(topicName, event.getTransactionId(), event);
                publishedToKafka = true;
            } catch (Exception ex) {
                log.warn("Failed to publish payment event to Kafka (falling back to direct consumer processing): {}", ex.getMessage());
            }
        }

        if (!publishedToKafka) {
            // Process synchronously via consumer logic when Kafka broker is unreachable or disabled
            try {
                fallbackConsumer.handlePaymentEventDirectly(event);
            } catch (Exception ex) {
                log.error("Failed fallback direct processing of payment event", ex);
            }
        }
    }
}
