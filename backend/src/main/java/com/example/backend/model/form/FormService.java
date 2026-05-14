package com.example.backend.model.form;

import com.example.backend.model.form.dto.FormSendRequest;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FormService {
    private final EmailService emailService;
    private final FormRepository formRepository;

    public void sendMessage(User sender, FormSendRequest request) {
        if (sender == null) {
            throw new IllegalArgumentException("Nie można wysłać wiadomości z nieautoryzowanego użytkownika");
        }

        Form form = new Form();
        form.setSender(sender);
        form.setContent(request.getContent());
        form.setSubject(request.getSubject());
        form.setSentAt(LocalDateTime.now());
        form = formRepository.save(form);

        emailService.sendMessageFromForm(sender, form.getSubject(), form.getContent());
    }
}
