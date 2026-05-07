package com.example.backend.model.application.dto;

import com.example.backend.model.application.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tools.jackson.databind.annotation.JsonDeserialize;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ext.javatime.deser.LocalDateDeserializer;
import tools.jackson.databind.ext.javatime.ser.LocalDateSerializer;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private Long id;
    private Long userId;
    private String diplomaUrl;
    private String university;
    private Long courseId;
    private Boolean isPaid;

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
    private String notes;
    private Boolean truthfulnessConsent;
    private Boolean gdprConsent;
    private Boolean newsletterConsent;
    private ApplicationStatus status;

    @JsonSerialize(using = LocalDateSerializer.class)
    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDateTime submissionDateTime;
}
