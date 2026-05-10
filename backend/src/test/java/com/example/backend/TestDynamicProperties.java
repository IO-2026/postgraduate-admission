package com.example.backend;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.boot.test.context.TestConfiguration;

@TestConfiguration
public class TestDynamicProperties {

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
        registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
        registry.add("spring.datasource.username", () -> "sa");
        registry.add("spring.datasource.password", () -> "");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.show-sql", () -> "false");
        registry.add("jwt.secret", () -> "01234567890123456789012345678901");
        registry.add("jwt.expiration", () -> "86400000");
        registry.add("spring.mail.host", () -> "localhost");
        registry.add("spring.mail.port", () -> "1025");
        registry.add("spring.mail.username", () -> "");
        registry.add("spring.mail.password", () -> "");
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> "1");
        registry.add("spring.datasource.hikari.minimum-idle", () -> "1");
        // Supabase properties (tests mock storage, so dummy values are safe)
        registry.add("supabase.url", () -> "http://localhost:54321");
        registry.add("supabase.service-role-key", () -> "test-dummy-key");
        registry.add("supabase.storage.diplomas-bucket", () -> "diplomas");
        registry.add("supabase.storage.diploma-max-bytes", () -> "10485760");
        registry.add("supabase.storage.signed-url-ttl-seconds", () -> "900");
        // Frontend URL used by SecurityConfig and other beans
        registry.add("frontend.url", () -> "http://localhost:5173");
    }
}
