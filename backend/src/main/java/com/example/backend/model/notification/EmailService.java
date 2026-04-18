package com.example.backend.model.notification;


import com.example.backend.model.application.Application;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    private static final Object RATE_LIMIT_LOCK = new Object();
    private static long lastSendAtMillis = 0L;
    private static final long MIN_INTERVAL_BETWEEN_EMAILS_MS = 5000L;


    public void sendApplicationStatusChange(User user, Application application) {
        String statusDescription = application.getStatus().getDescription();

        String content = String.format("""
        Cześć %s!
        
        Status Twojego zgłoszenia na kurs (ID: %d) zmienił się.
        Aktualny status: %s.
        """,
                user.getName(),
                application.getCourseId(),
                statusDescription
        );

        send(user.getEmail(), "Zmiana statusu zgłoszenia", content);
    }

    public void sendWelcomeEmail(User user) {
        String content = String.format(
                "Witaj w systemie, %s! Twoje konto zostało utworzone.",
                user.getName()
        );
        send(user.getEmail(), "Witamy w rekrutacji!", content);
    }

    private void send(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("rekrutacja@twojprojekt.pl");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);

        int attempt = 0;
        while (true) {
            attempt++;
            try {
                throttle();
                mailSender.send(message);
                return;
            } catch (MailException exception) {
                if (attempt >= 5 || !isRetryable(exception)) {
                    throw exception;
                }

                try {
                    Thread.sleep(1000L * attempt);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    throw exception;
                }
            }
        }
    }

    private boolean isRetryable(MailException exception) {
        String message = exception.getMessage();
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        // Mailtrap free plan can rate-limit; brief retry helps for bursty dev testing.
        return lower.contains("too many emails") || lower.contains("too many emails per second");
    }

    private void throttle() {
        synchronized (RATE_LIMIT_LOCK) {
            long now = System.currentTimeMillis();
            long elapsed = now - lastSendAtMillis;
            long waitMs = MIN_INTERVAL_BETWEEN_EMAILS_MS - elapsed;
            if (waitMs > 0) {
                try {
                    Thread.sleep(waitMs);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                }
            }
            lastSendAtMillis = System.currentTimeMillis();
        }
    }
}
