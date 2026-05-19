package com.example.backend.validation;

import com.example.backend.model.application.dto.ApplicationDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDate;

public class ApplicationConsistentValidator
        implements ConstraintValidator<ApplicationConsistent, ApplicationDto> {

    private static final int[] WEIGHTS = {1, 3, 7, 9, 1, 3, 7, 9, 1, 3};

    @Override
    public boolean isValid(ApplicationDto dto, ConstraintValidatorContext context) {
        if (dto == null) {
            return true;
        }

        boolean peselValid = peselValidation(dto);
        boolean dateValid = dateValidation(dto);

        return peselValid && dateValid;
    }

    private boolean dateValidation(ApplicationDto dto) {

        LocalDate dob = dto.getCandidateDateOfBirth();
        if (dob == null) {
            return true;
        }
        Integer graduationYear = dto.getGraduationYear();
        if (graduationYear == null) {
            return true;
        }
        LocalDate today = LocalDate.now();

        if (dob.isAfter(today)) {
            return false;
        }
        if (graduationYear > today.getYear()) {
            return false;
        }
        if (graduationYear < dob.getYear()) {
            return false;
        }

        return true;
    }

    private boolean peselValidation(ApplicationDto dto) {
        if (dto == null) return true;

        String pesel = dto.getCandidatePesel();
        LocalDate dob = dto.getCandidateDateOfBirth();

        if (pesel == null || dob == null) return true;

        if (!pesel.matches("\\d{11}")) return false;

        int sum = 0;
        for (int i = 0; i < 10; i++) {
            sum += (pesel.charAt(i) - '0') * WEIGHTS[i];
        }

        int checksum = (10 - (sum % 10)) % 10;
        if (checksum != (pesel.charAt(10) - '0')) {
            return false;
        }

        int year = Integer.parseInt(pesel.substring(0, 2));
        int month = Integer.parseInt(pesel.substring(2, 4));
        int day = Integer.parseInt(pesel.substring(4, 6));

        int fullYear = resolveCentury(month) + year;
        month = normalizeMonth(month);

        LocalDate peselDate;
        try {
            peselDate = LocalDate.of(fullYear, month, day);
        } catch (Exception e) {
            return false;
        }

        return peselDate.equals(dob);
    }

    private int resolveCentury(int month) {
        if (month >= 1 && month <= 12) return 1900;
        if (month >= 21 && month <= 32) return 2000;
        if (month >= 41 && month <= 52) return 2100;
        if (month >= 61 && month <= 72) return 2200;
        if (month >= 81 && month <= 92) return 1800;
        return 0;
    }

    private int normalizeMonth(int month) {
        if (month > 80) return month - 80;
        if (month > 60) return month - 60;
        if (month > 40) return month - 40;
        if (month > 20) return month - 20;
        return month;
    }
}
