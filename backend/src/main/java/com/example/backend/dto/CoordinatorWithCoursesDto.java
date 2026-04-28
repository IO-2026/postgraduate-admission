package com.example.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class CoordinatorWithCoursesDto {
    private Long id;
    private String name;
    private String email;
    private List<CourseBriefDto> courses;
}
