package com.example.backend;

import com.example.backend.model.application.dto.ApplicationDto;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class ApplicationDtoValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private ApplicationDto buildValidDto() {
        return ApplicationDto.builder()
                .courseId(1L)
                .university("Uniwersytet Jagielloński")
                .applicantDateOfBirth(LocalDate.of(1999, 5, 10))
                .applicantPesel("99051073019")
                .addressStreet("Testowa 1")
                .addressPostalCode("43-300")
                .addressCity("Bielsko-Biała")
                .previousDegree("Inżynier")
                .fieldOfStudy("Informatyka")
                .graduationYear(2023)
                .placeOfBirth("Kraków")
                .truthfulnessConsent(true)
                .gdprConsent(true)
                .newsletterConsent(false)
                .build();
    }

    @Test
    void applicationDto_ShouldPass_WhenValid() {
        ApplicationDto dto = buildValidDto();

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertTrue(violations.isEmpty());
    }

    @Test
    void applicantPesel_ShouldFail_WhenInvalidChecksum() {
        ApplicationDto dto = buildValidDto();
        dto.setApplicantPesel("12345678901");

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void applicantPesel_ShouldFail_WhenContainsLetters() {
        ApplicationDto dto = buildValidDto();
        dto.setApplicantPesel("ABC12345678");

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void applicantDateOfBirth_ShouldFail_WhenFuture() {
        ApplicationDto dto = buildValidDto();
        dto.setApplicantDateOfBirth(LocalDate.now().plusDays(1));

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void addressPostalCode_ShouldFail_WhenInvalidFormat() {
        ApplicationDto dto = buildValidDto();
        dto.setAddressPostalCode("99999");

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void university_ShouldFail_WhenBlank() {
        ApplicationDto dto = buildValidDto();
        dto.setUniversity("   ");

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void addressCity_ShouldFail_WhenBlank() {
        ApplicationDto dto = buildValidDto();
        dto.setAddressCity("");

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void graduationYear_ShouldFail_WhenInFuture() {
        ApplicationDto dto = buildValidDto();
        dto.setGraduationYear(LocalDate.now().getYear() + 1);

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void gdprConsent_ShouldFail_WhenFalse() {
        ApplicationDto dto = buildValidDto();
        dto.setGdprConsent(false);

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void truthfulnessConsent_ShouldFail_WhenFalse() {
        ApplicationDto dto = buildValidDto();
        dto.setTruthfulnessConsent(false);

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void courseId_ShouldFail_WhenNull() {
        ApplicationDto dto = buildValidDto();
        dto.setCourseId(null);

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void university_ShouldFail_WhenTooLong() {
        ApplicationDto dto = buildValidDto();
        dto.setUniversity("A".repeat(300));

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }

    @Test
    void notes_ShouldFail_WhenTooLong() {
        ApplicationDto dto = buildValidDto();
        dto.setNotes("A".repeat(5001));

        Set<ConstraintViolation<ApplicationDto>> violations = validator.validate(dto);

        assertFalse(violations.isEmpty());
    }
}