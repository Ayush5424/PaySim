package com.Project.UPI_Simulation.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
@ConditionalOnProperty(name = "spring.kafka.bootstrap-servers")
public class KafkaConfig {

    @Value("${app.kafka.topics.payment-events:paysim-payment-events}")
    private String paymentEventsTopic;

    @Value("${app.kafka.topics.payment-dlq:paysim-payment-dlq}")
    private String paymentDlqTopic;

    @Bean
    public NewTopic paymentEventsTopic() {
        return TopicBuilder.name(paymentEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic paymentDlqTopic() {
        return TopicBuilder.name(paymentDlqTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
