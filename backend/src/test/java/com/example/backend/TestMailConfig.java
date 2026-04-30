package com.example.backend;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessagePreparator;

import java.io.InputStream;
import java.util.Properties;

@Configuration
public class TestMailConfig {

    @Bean
    public JavaMailSender javaMailSender() {
        return new JavaMailSender() {
            private Session session = Session.getDefaultInstance(new Properties());

            @Override
            public MimeMessage createMimeMessage() {
                return new MimeMessage(session);
            }

            @Override
            public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
                try {
                    return new MimeMessage(session, contentStream);
                } catch (Exception e) {
                    throw new MailException("Failed to create MimeMessage from stream") {};
                }
            }

            @Override
            public void send(MimeMessage mimeMessage) throws MailException {
                // no-op
            }

            @Override
            public void send(MimeMessage... mimeMessages) throws MailException {
                // no-op
            }

            @Override
            public void send(MimeMessagePreparator mimeMessagePreparator) throws MailException {
                // no-op
            }

            @Override
            public void send(MimeMessagePreparator... mimeMessagePreparators) throws MailException {
                // no-op
            }

            @Override
            public void send(SimpleMailMessage simpleMessage) throws MailException {
                // no-op
            }

            @Override
            public void send(SimpleMailMessage... simpleMessages) throws MailException {
                // no-op
            }
        };
    }
}
