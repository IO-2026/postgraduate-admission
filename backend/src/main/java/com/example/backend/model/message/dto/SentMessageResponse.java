package com.example.backend.model.message.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class SentMessageResponse {
    private Long messageId;
    private String subject;
    private String content;
    private LocalDateTime sentAt;
    private List<RecipientStatusResponse> recipients;
}