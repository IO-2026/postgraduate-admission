package com.example.backend.admission.dto;

import java.util.List;

public record AdmissionFormMetadataResponse(
        String title,
        String description,
        List<AdmissionFieldDefinitionDto> fields
) {
}
