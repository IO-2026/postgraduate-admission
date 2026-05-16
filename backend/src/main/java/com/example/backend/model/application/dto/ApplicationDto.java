package com.example.backend.model.application.dto;

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
public class ApplicationDto {
    private Long id;
    private Long userId;
    private String university;
    private Long courseId;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate applicantDateOfBirth;

    private String applicantPesel;
    private String addressStreet;
    private String addressPostalCode;
    private String addressCity;
    private String previousDegree;
    private String fieldOfStudy;
    private Integer graduationYear;
    private String applicantPlaceOfBirth;
    private String notes;
    private Boolean truthfulnessConsent;
    private Boolean gdprConsent;
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
