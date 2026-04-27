package com.example.backend.model.application.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdmissionSubmitRequest {

    @NotNull(message = "Dane kandydata są wymagane.")
    @Valid
    private AdmissionApplicantDto applicant;

    @NotNull(message = "Dane o wykształceniu są wymagane.")
    @Valid
    private AdmissionEducationDto education;

    @NotNull(message = "Szczegóły wniosku są wymagane.")
    @Valid
    private AdmissionDetailsDto details;
}
