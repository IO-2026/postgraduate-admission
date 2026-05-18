package com.example.backend.model.message.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class RecipientStatusResponse {
    private Long  recipientId;
    private Boolean isRead;
}