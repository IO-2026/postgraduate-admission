package com.example.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

public class AcademicYearValidator implements ConstraintValidator<ValidAcademicYear, Integer> {

    @Override
    public void initialize(ValidAcademicYear annotation) {
    }

    @Override
    public boolean isValid(Integer academicYear, ConstraintValidatorContext context) {
        if (academicYear == null) {
            return false;
        }

        LocalDate today = LocalDate.now();
        LocalDate cutoffDate = LocalDate.of(academicYear, 10, 1);

        return today.isBefore(cutoffDate);
    }
}
