package com.example.backend.model.application.dto;

import com.example.backend.validation.ApplicationConsistent;
import com.example.backend.validation.GraduationYear;
import com.example.backend.validation.Pesel;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ext.javatime.deser.LocalDateDeserializer;
import tools.jackson.databind.ext.javatime.deser.LocalDateTimeDeserializer;
import tools.jackson.databind.ext.javatime.ser.LocalDateSerializer;
import tools.jackson.databind.ext.javatime.ser.LocalDateTimeSerializer;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApplicationConsistent
public class ApplicationDto {
    private Long id;
    private Long userId;

    @NotBlank
    @Size(min = 2, max = 200)
    private String university;

    @NotNull
    private Long courseId;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate applicantDateOfBirth;

    @NotBlank
    @Pesel
    private String applicantPesel;

    @NotBlank
    @Size(min = 2, max = 120)
    private String addressStreet;

    @NotBlank
    @Pattern(regexp = "\\d{2}-\\d{3}", message = "Nieprawidłowy kod pocztowy.")
    private String addressPostalCode;

    @NotBlank
    @Size(min = 2, max = 80)
    private String addressCity;

    @Size(max = 120)
    private String previousDegree;

    @Size(max = 120)
    private String fieldOfStudy;

    @GraduationYear
    private Integer graduationYear;

    private String placeOfBirth;

    @Size(max = 500)
    private String notes;

    @NotNull
    @AssertTrue
    private Boolean truthfulnessConsent;

    @NotNull
    @AssertTrue
    private Boolean gdprConsent;

    @NotNull
    private Boolean newsletterConsent;

    @JsonSerialize(using = LocalDateTimeSerializer.class)
    @JsonDeserialize(using = LocalDateTimeDeserializer.class)
    private LocalDateTime submissionDateTime;

    private Boolean isWithdrawn;
    private Boolean isAccepted;
    private Boolean isEntryFeePaid;
    private Boolean isDiplomaVerified;
    private Boolean isDeclarationVerified;
    private Boolean isSemesterPaid;
}
