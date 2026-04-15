package com.example.backend.model.notification;


import com.example.backend.model.application.Application;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;


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
        mailSender.send(message);
    }
}
