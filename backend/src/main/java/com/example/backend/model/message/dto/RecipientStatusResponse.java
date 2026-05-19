package com.example.backend.model.message.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecipientStatusResponse {
    private Long recipientId;
    private String recipientNameAndSurname;
    private String recipientEmail;
    private Boolean isRead;
}