package com.example.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.net.URI;

public class ValidUrlValidator implements ConstraintValidator<ValidUrl, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String raw = value.trim();
        if (raw.isEmpty()) {
            return true;
        }

        try {
            URI uri = URI.create(raw);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null) {
                return false;
            }
            return scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https");
        } catch (Exception ex) {
            return false;
        }
    }
}
