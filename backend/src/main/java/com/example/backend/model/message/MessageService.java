package com.example.backend.model.message;

import com.example.backend.model.message.dto.MessageResponse;
import com.example.backend.model.message.dto.MessageSendRequest;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MessageRecipientRepository recipientRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public void sendMessage(User sender, MessageSendRequest request) {
        String roleName = sender.getRole().getName();
        if (!roleName.equals("Coordinator") && !roleName.equals("Admin")) {
            throw new SecurityException("Tylko koordynatorzy lub administratorzy mogą wysyłać wiadomości");
        }

        List<User> recipients = new ArrayList<>();
        if (request.getToAllCandidates()) {
            recipients = userRepository.findAll().stream()
                    .filter(u -> u.getRole() != null && u.getRole().getId() == 1)
                    .collect(Collectors.toList());
            if (recipients.isEmpty()) {
                throw new IllegalArgumentException("Nie znaleziono kandydatów");
            }
        } else if (request.getRecipientIds() != null && !request.getRecipientIds().isEmpty()) {
            recipients = userRepository.findAllById(request.getRecipientIds());
            if (recipients.size() != request.getRecipientIds().size()) {
                throw new IllegalArgumentException("Niektórzy odbiorcy nie istnieją");
            }
        } else {
            throw new IllegalArgumentException("Nie określono odbiorców");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setSubject(request.getSubject());
        message.setContent(request.getContent());
        message.setSentAt(LocalDateTime.now());
        message.setIsBroadcast(request.getToAllCandidates());
        message = messageRepository.save(message);

        for (User recipient : recipients) {
            MessageRecipient mr = new MessageRecipient();
            mr.setMessage(message);
            mr.setRecipient(recipient);
            recipientRepository.save(mr);

            emailService.sendMessageToCandidate(recipient, message.getSubject(), message.getContent());
        }
    }

    public List<MessageResponse> getInboxForUser(Long userId) {
        List<MessageRecipient> recipients = recipientRepository.findAllByRecipientIdWithMessage(userId);
        return recipients.stream()
                .map(mr -> new MessageResponse(
                        mr.getId(),
                        mr.getMessage().getSender().getName() + " " + mr.getMessage().getSender().getSurname(),
                        mr.getMessage().getSubject(),
                        mr.getMessage().getContent(),
                        mr.getMessage().getSentAt(),
                        mr.getIsRead()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long recipientId, Long userId) {
        int updated = recipientRepository.markAsRead(recipientId, userId);
        if (updated == 0) {
            throw new IllegalArgumentException("Odbiorca wiadomości nie znaleziony lub już przeczytany");
        }
    }

    public long getUnreadCount(Long userId) {
        return recipientRepository.countByRecipientIdAndIsReadFalse(userId);
    }
}