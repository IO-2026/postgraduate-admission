package com.example.backend.model.course.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private Long id;
    private String name;
    private String description;
    private Double price;
    @NotNull(message = "Limit miejsc jest wymagany.")
    @Min(value = 1, message = "Limit miejsc musi wynosić co najmniej 1.")
    private Integer placesLimit;
    private LocalDate recruitmentStart;
    private LocalDate recruitmentEnd;
    private Long coordinatorId;
    private String coordinatorName;
    private String coordinatorEmail;
    private String academicYear;
}
