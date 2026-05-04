package com.example.backend.model.message.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class MessageSendRequest {

    @NotBlank(message = "Temat jest wymagany")
    @Size(max = 200, message = "Temat może mieć maksymalnie 200 znaków")
    private String subject;

    @NotBlank(message = "Treść jest wymagana")
    @Size(max = 4000, message = "Treść może mieć maksymalnie 4000 znaków")
    private String content;

    private List<Long> recipientIds;

    private Boolean toAllCandidates = false;
}