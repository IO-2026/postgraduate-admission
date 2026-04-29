package com.example.backend.model.course.dto;

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
    private LocalDate recruitmentStart;
    private LocalDate recruitmentEnd;
    private Long coordinatorId;
}
