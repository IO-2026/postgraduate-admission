package com.example.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = PostalCodePLValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface PostalCodePL {
    String message() default "Podaj poprawny kod pocztowy (np. 30-059).";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
