package com.example.backend.model.application.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdmissionEducationDto {

    @Size(max = 120, message = "Nazwa ukończonych studiów jest za długa.")
    private String previousDegree;

    @Size(max = 120, message = "Nazwa kierunku jest za długa.")
    private String fieldOfStudy;

    @Min(value = 1900, message = "Rok ukończenia jest nieprawidłowy.")
    @Max(value = 2100, message = "Rok ukończenia jest nieprawidłowy.")
    private Integer graduationYear;
}
