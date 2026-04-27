package com.example.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class PeselValidator implements ConstraintValidator<Pesel, String> {

    private static final int[] WEIGHTS = {1, 3, 7, 9, 1, 3, 7, 9, 1, 3};

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String pesel = value.trim();
        if (pesel.isEmpty()) {
            return true;
        }

        if (!pesel.matches("\\d{11}")) {
            return false;
        }

        int sum = 0;
        for (int i = 0; i < WEIGHTS.length; i++) {
            int digit = pesel.charAt(i) - '0';
            sum += digit * WEIGHTS[i];
        }

        int checksum = (10 - (sum % 10)) % 10;
        int lastDigit = pesel.charAt(10) - '0';
        return checksum == lastDigit;
    }
}
