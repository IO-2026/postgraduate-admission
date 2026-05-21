package com.example.backend;

import com.example.backend.model.course.dto.CourseDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class AcademicYearValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void academicYear_ShouldBeInvalid_WhenNull() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(5000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .academicYear(null)
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Null academic year should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Rok akademicki jest wymagany")),
            "Should contain required message");
    }

    @Test
    void academicYear_ShouldBeValid_WhenBeforeOctober1stCutoff() {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        int testYear;

        if (today.isBefore(LocalDate.of(currentYear, 10, 1))) {
            testYear = currentYear;
        } else {
            testYear = currentYear + 1;
        }

        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(5000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .academicYear(testYear)
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Academic year before October 1st cutoff should be valid");
    }

    @Test
    void academicYear_ShouldBeInvalid_WhenBeforeOctober1stButPastYear() {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        int invalidYear = currentYear - 1;

        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(5000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .academicYear(invalidYear)
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Past year should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Rok akademicki musi być w przyszłości")),
            "Should contain future validation message");
    }

    @Test
    void academicYear_ShouldBeValid_WhenMultipleYearsInFuture() {
        int futureYear = LocalDate.now().getYear() + 5;

        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(5000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .academicYear(futureYear)
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Academic year multiple years in future should be valid");
    }

    @Test
    void academicYear_ShouldBeValid_OnSeptemberBeforeCutoff() {
        LocalDate today = LocalDate.now();
        if (today.getMonthValue() < 10) {
            int currentYear = today.getYear();
            CourseDTO courseDTO = CourseDTO.builder()
                .name("Test Course")
                .price(5000.0)
                .placesLimit(30)
                .recruitmentStart(LocalDate.now())
                .recruitmentEnd(LocalDate.now().plusMonths(3))
                .academicYear(currentYear)
                .build();

            Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
            assertTrue(violations.isEmpty(), "Current year should be valid if before October 1st");
        }
    }
}
