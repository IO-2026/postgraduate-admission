package com.example.backend.model.application.dto;

import com.example.backend.validation.Pesel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class AdmissionApplicantDto {

    @NotBlank(message = "Imię jest wymagane.")
    @Size(min = 2, max = 50, message = "Imię musi mieć od 2 do 50 znaków.")
    private String name;

    @NotBlank(message = "Nazwisko jest wymagane.")
    @Size(min = 2, max = 80, message = "Nazwisko musi mieć od 2 do 80 znaków.")
    private String surname;

    @NotBlank(message = "Numer telefonu jest wymagany.")
    @Pattern(regexp = "^[0-9+()\\-\\s]{7,20}$", message = "Podaj poprawny numer telefonu.")
    private String telNumber;

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
