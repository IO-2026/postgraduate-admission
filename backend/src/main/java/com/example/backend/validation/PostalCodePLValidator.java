package com.example.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PostalCodePLValidator implements ConstraintValidator<PostalCodePL, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String postalCode = value.trim();
        if (postalCode.isEmpty()) {
            return true;
        }

        return postalCode.matches("\\d{2}-\\d{3}");
    }
}
