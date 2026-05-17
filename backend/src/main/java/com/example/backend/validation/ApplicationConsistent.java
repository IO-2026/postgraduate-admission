package com.example.backend.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Constraint(validatedBy = ApplicationConsistentValidator.class)
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ApplicationConsistent {
    String message() default "Wpisano niepoprawne dane, sprawdź ponownie wartość poszczególnych pól, " +
            "poprawność dat oraz numeru pesel";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
