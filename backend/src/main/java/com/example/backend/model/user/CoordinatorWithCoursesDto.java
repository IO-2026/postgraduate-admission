package com.example.backend.model.user;

import com.example.backend.model.course.CourseBriefDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CoordinatorWithCoursesDto {
    private Long id;
    private String name;
    private String email;
    private List<CourseBriefDto> courses;
}
