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

public class CoursePriceValidationTests {

    private Validator validator;

    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    void coursePrice_ShouldBeValid_WhenPriceIsZero() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(0.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Price of 0 should be valid");
    }

    @Test
    void coursePrice_ShouldBeValid_WhenPriceIsInMiddleOfRange() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(50000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Price of 50000 should be valid");
    }

    @Test
    void coursePrice_ShouldBeValid_WhenPriceIsMaximum() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(100000.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Price of 100000 should be valid");
    }

    @Test
    void coursePrice_ShouldFail_WhenPriceIsNegative() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(-1.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Negative price should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Cena musi być co najmniej 0")),
            "Should contain min price validation message");
    }

    @Test
    void coursePrice_ShouldFail_WhenPriceExceedsMaximum() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(100001.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Price exceeding 100000 should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Cena nie może przekraczać 100000")),
            "Should contain max price validation message");
    }

    @Test
    void coursePrice_ShouldFail_WhenPriceMuchHigherThanMaximum() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(999999.0)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Very high price should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Cena nie może przekraczać 100000")),
            "Should contain max price validation message");
    }

    @Test
    void coursePrice_ShouldFail_WhenPriceIsJustBelowMinimum() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(-0.01)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertFalse(violations.isEmpty(), "Price just below 0 should be invalid");
        assertTrue(violations.stream()
            .anyMatch(v -> v.getMessage().contains("Cena musi być co najmniej 0")),
            "Should contain min price validation message");
    }

    @Test
    void coursePrice_ShouldBeValid_WhenPriceHasDecimals() {
        CourseDTO courseDTO = CourseDTO.builder()
            .name("Test Course")
            .price(1999.99)
            .placesLimit(30)
            .recruitmentStart(LocalDate.now())
            .recruitmentEnd(LocalDate.now().plusMonths(3))
            .build();

        Set<ConstraintViolation<CourseDTO>> violations = validator.validate(courseDTO);
        assertTrue(violations.isEmpty(), "Price with decimals in valid range should be valid");
    }
}
