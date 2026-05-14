package com.example.backend.model.course.dto;

import com.example.backend.validation.ValidDateRange;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@ValidDateRange(message = "Data zakończenia rekrutacji nie może być wcześniejsza niż data rozpoczęcia rekrutacji.")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseDTO {
    private Long id;
    private String name;
    private String description;
    @Min(value = 0, message = "Cena musi być co najmniej 0")
    @Max(value = 100000, message = "Cena nie może przekraczać 100000")
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
