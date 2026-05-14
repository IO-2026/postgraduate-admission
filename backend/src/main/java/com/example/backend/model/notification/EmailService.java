package com.example.backend.model.notification;

import com.example.backend.model.application.Application;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;

    @Async
    @Retryable(
            retryFor = {MailException.class},
            maxAttempts = 5,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendWelcomeEmail(User user) {
        String content = String.format(
                "Witaj w systemie, %s! Twoje konto zostało utworzone.",
                user.getName()
        );
        send(user.getEmail(), "Witamy w rekrutacji!", content);
    }

    @Async
    @Retryable(
            retryFor = {MailException.class},
            maxAttempts = 5,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendApplicationStatusChange(User user, Application application) {
        String statusDescription = "To jest to przemyślenia";

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

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("rekrutacja@twojprojekt.pl");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);

            mailSender.send(message);
        } catch (MailException e) {
            // Log the error but don't rethrow to ensure it doesn't affect the caller thread
            System.err.println("CRITICAL: Failed to send email to " + to + " after retries: " + e.getMessage());
        }
    }

    @Async
    @Retryable(
            retryFor = {MailException.class},
            maxAttempts = 5,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendMessageToCandidate(User candidate, String subject, String messageContent) {
        String fullSubject = "[Wiadomość od koordynatora] " + subject;
        String body = String.format("""
                Witaj %s!
                
                Otrzymałeś nową wiadomość od koordynatora:
                
                Temat: %s
                Treść:
                %s
                
                Zaloguj się do systemu, aby przeczytać wiadomość.
                
                Pozdrawiamy,
                Zespół rekrutacji
                """, candidate.getName(), subject, messageContent);

        send(candidate.getEmail(), fullSubject, body);
    }

    @Async
    @Retryable(
            retryFor = {MailException.class},
            maxAttempts = 5,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public void sendMessageFromForm(User candidate, String subject, String messageContent) {
        String fullSubject = "[Wiadomość od kandydata] " + subject;
        String body = String.format("""
                Otrzymałeś nową wiadomość od kandydata na studia
                Użytkownik %s przesłał wiadomość:
                
                Temat: %s
                Treść:
                %s
                
                
                odpowiedź w systemie bądź przez maila: %s
                """, candidate.getName(), subject, messageContent, candidate.getEmail());

        send("jakiś_mail_wspólny@xyzabccbazyx.com", fullSubject, body);
    }
}
