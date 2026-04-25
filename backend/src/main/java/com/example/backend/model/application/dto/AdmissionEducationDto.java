package com.example.backend.model.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdmissionEducationDto {

    @NotBlank(message = "Pole jest wymagane.")
    @Size(max = 120, message = "Nazwa ukończonych studiów jest za długa.")
    private String previousDegree;

    @NotBlank(message = "Pole jest wymagane.")
    @Size(max = 120, message = "Nazwa kierunku jest za długa.")
    private String fieldOfStudy;

    @NotNull(message = "Pole jest wymagane.")
    @Min(value = 1900, message = "Rok ukończenia jest nieprawidłowy.")
    @Max(value = 2100, message = "Rok ukończenia jest nieprawidłowy.")
    private Integer graduationYear;
}
