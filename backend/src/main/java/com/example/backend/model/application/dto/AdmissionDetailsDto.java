package com.example.backend.model.application.dto;

import com.example.backend.validation.ValidUrl;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdmissionDetailsDto {

    @NotNull(message = "Identyfikator kursu jest wymagany.")
    @Positive(message = "Identyfikator kursu jest nieprawidłowy.")
    private Long courseId;

    @NotBlank(message = "Uczelnia jest wymagana.")
    @Size(min = 2, max = 200, message = "Nazwa uczelni musi mieć od 2 do 200 znaków.")
    private String university;

    @NotBlank(message = "Link do dyplomu jest wymagany.")
    @ValidUrl(message = "Podaj poprawny link do dyplomu (http/https).")
    private String diplomaUrl;

    @Size(max = 2000, message = "Uwagi są zbyt długie.")
    private String notes;

    @AssertTrue(message = "Wymagana zgoda na prawdziwość danych.")
    private boolean truthfulnessConsent;

    @AssertTrue(message = "Wymagana zgoda RODO.")
    private boolean gdprConsent;
}
