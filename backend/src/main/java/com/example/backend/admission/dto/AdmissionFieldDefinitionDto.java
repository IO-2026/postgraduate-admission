package com.example.backend.admission.dto;

import java.util.List;

public record AdmissionFieldDefinitionDto(
        String name,
        String label,
        String type,
        boolean required,
        String placeholder,
        String validationHint,
        List<AdmissionFieldOptionDto> options
) {
}
