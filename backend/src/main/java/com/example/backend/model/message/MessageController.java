package com.example.backend.model.message;

import com.example.backend.model.message.dto.MessageResponse;
import com.example.backend.model.message.dto.MessageSendRequest;
import com.example.backend.model.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@Valid @RequestBody MessageSendRequest request,
                                            @AuthenticationPrincipal User sender) {
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        messageService.sendMessage(sender, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<MessageResponse>> getInbox(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(messageService.getInboxForUser(user.getId()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(messageService.getUnreadCount(user.getId()));
    }

    @PatchMapping("/{recipientId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long recipientId,
                                           @AuthenticationPrincipal User user) {
        System.out.println(user);
        System.out.println(recipientId);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        messageService.markAsRead(recipientId, user.getId());
        return ResponseEntity.ok().build();
    }
}