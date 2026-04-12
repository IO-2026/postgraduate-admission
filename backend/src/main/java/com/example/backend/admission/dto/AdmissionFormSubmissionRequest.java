package com.example.backend.admission.dto;

public record AdmissionFormSubmissionRequest(
        String name,
        String surname,
        String email,
        String telNumber,
        String programCode,
        String educationLevel,
        String motivation,
        Boolean consentAccepted
) {
}
