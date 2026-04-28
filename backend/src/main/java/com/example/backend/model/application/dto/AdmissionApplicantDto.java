package com.example.backend.model.application.dto;

import com.example.backend.validation.Pesel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdmissionApplicantDto {

    @NotNull(message = "Data urodzenia jest wymagana.")
    @Past(message = "Data urodzenia musi być w przeszłości.")
    private LocalDate dateOfBirth;

    @NotBlank(message = "PESEL jest wymagany.")
    @Pesel
    private String pesel;

    @NotNull(message = "Adres jest wymagany.")
    @Valid
    private AdmissionAddressDto address;
}
