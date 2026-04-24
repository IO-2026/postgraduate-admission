package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class AssignmentDto {
    private Long id;
    private Long coordinatorId;
    private String coordinatorName;
    private String coordinatorEmail;
    private Long courseId;
    private String courseName;
    private Long cohortId;
    private String cohortName;
}
