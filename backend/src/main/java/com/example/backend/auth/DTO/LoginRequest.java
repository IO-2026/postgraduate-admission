package com.example.backend.auth.DTO;

import lombok.Data;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class LoginRequest {
    @NotBlank(message = "E-mail jest wymagany.")
    @Email(message = "Podaj poprawny adres e-mail.")
    private String email;

    @NotBlank(message = "Hasło jest wymagane.")
    private String password;
}
