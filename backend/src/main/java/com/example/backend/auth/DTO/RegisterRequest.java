package com.example.backend.auth.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "Imię jest wymagane.")
    @Size(min = 2, max = 50, message = "Imię musi mieć od 2 do 50 znaków.")
    private String name;

    @NotBlank(message = "Nazwisko jest wymagane.")
    @Size(min = 2, max = 50, message = "Nazwisko musi mieć od 2 do 50 znaków.")
    private String surname;

    @NotBlank(message = "E-mail jest wymagany.")
    @Email(message = "Podaj poprawny adres e-mail.")
    private String email;

    @NotBlank(message = "Hasło jest wymagane.")
    @Size(min = 8, max = 72, message = "Hasło musi mieć od 8 do 72 znaków.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Hasło musi zawierać przynajmniej jedną literę i jedną cyfrę."
    )
    private String password;

    @NotBlank(message = "Numer telefonu jest wymagany.")
    @Pattern(
            regexp = "^[0-9+()\\-\\s]{7,20}$",
            message = "Podaj poprawny numer telefonu."
    )
    private String telNumber;
}