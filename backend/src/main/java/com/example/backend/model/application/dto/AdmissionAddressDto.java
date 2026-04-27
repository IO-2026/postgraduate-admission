package com.example.backend.model.application.dto;

import com.example.backend.validation.PostalCodePL;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdmissionAddressDto {

    @NotBlank(message = "Ulica jest wymagana.")
    @Size(min = 2, max = 120, message = "Ulica musi mieć od 2 do 120 znaków.")
    private String street;

    @NotBlank(message = "Kod pocztowy jest wymagany.")
    @PostalCodePL
    private String postalCode;

    @NotBlank(message = "Miasto jest wymagane.")
    @Size(min = 2, max = 80, message = "Miasto musi mieć od 2 do 80 znaków.")
    private String city;
}
