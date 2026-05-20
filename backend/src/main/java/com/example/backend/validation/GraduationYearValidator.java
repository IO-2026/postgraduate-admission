package com.example.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class GraduationYearValidator implements ConstraintValidator<GraduationYear, Integer> {

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        if (value == null) return true;

        int currentYear = java.time.Year.now().getValue();

        return value >= 1900 && value <= currentYear;
    }
}
