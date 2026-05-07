package com.example.backend.model.message.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class MessageResponse {
    private Long recipientId;
    private String senderName;
    private String subject;
    private String content;
    private LocalDateTime sentAt;
    private Boolean isRead;
}