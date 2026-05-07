package com.example.backend.model.application.dto;

import com.example.backend.model.application.ApplicationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private ApplicationStatus status;
    private LocalDateTime submissionDateTime;
}
