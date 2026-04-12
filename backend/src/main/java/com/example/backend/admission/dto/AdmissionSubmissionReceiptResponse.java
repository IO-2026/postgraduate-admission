package com.example.backend.admission.dto;

public record AdmissionSubmissionReceiptResponse(
        String submissionId,
        String status,
        String message
) {
}
