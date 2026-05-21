package com.example.backend;

import com.example.backend.model.course.dto.CourseDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.time.LocalDate;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class CourseValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    private int getValidAcademicYear() {
        LocalDate today = LocalDate.now();
        int currentYear = today.getYear();
        if (today.isBefore(LocalDate.of(currentYear, 10, 1))) {
            return currentYear;
        } else {
            return currentYear + 1;
        }
    }

    @Test
    void testCourseDTO_ShouldPass_WhenEndDateIsAfterStartDate() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.of(2024, 1, 1))
            .recruitmentEnd(LocalDate.of(2024, 3, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Should not have violations when end date is after start date");
    }

    @Test
    void testCourseDTO_ShouldPass_WhenEndDateEqualsStartDate() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.of(2024, 1, 1))
            .recruitmentEnd(LocalDate.of(2024, 1, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Should not have violations when end date equals start date");
    }

    @Test
    void testCourseDTO_ShouldFail_WhenEndDateIsBeforeStartDate() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.of(2024, 3, 1))
            .recruitmentEnd(LocalDate.of(2024, 1, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Should have violations when end date is before start date");
        
        ConstraintViolation<CourseDTO> violation = violations.iterator().next();
        assertTrue(violation.getMessage().contains("Data zakończenia rekrutacji nie może być wcześniejsza"),
            "Error message should mention recruitment end date cannot be earlier");
    }

    @Test
    void testCourseDTO_ShouldPass_WhenOnlyStartDateIsProvided() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.of(2024, 1, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Should not have violations when only start date is provided");
    }

    @Test
    void testCourseDTO_ShouldPass_WhenOnlyEndDateIsProvided() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .recruitmentEnd(LocalDate.of(2024, 3, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Should not have violations when only end date is provided");
    }

    @Test
    void testCourseDTO_ShouldPass_WhenNoDatesAreProvided() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(30)
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Should not have violations when no dates are provided");
    }

    @Test
    void testCourseDTO_ShouldFail_WhenPlacesLimitIsBelowMinimum() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1000.0)
            .placesLimit(0)
            .recruitmentStart(LocalDate.of(2024, 1, 1))
            .recruitmentEnd(LocalDate.of(2024, 3, 1))
            .academicYear(getValidAcademicYear())
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Should have violations when places limit is below 1");
    }
}
