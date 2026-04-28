package com.example.backend.controller;

import com.example.backend.dto.CoordinatorDto;
import com.example.backend.dto.CoordinatorWithCoursesDto;
import com.example.backend.dto.CourseBriefDto;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.course.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class CoordinatorController {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public CoordinatorController(UserRepository userRepository, CourseRepository courseRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/admin/coordinators")
    public ResponseEntity<List<CoordinatorDto>> getCoordinators() {
        List<CoordinatorDto> dtos = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> new CoordinatorDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/admin/coordinators-with-courses")
    public ResponseEntity<List<CoordinatorWithCoursesDto>> getCoordinatorsWithCourses() {
        List<CoordinatorWithCoursesDto> dtos = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> {
                    List<CourseBriefDto> courses = courseRepository.findByCoordinatorId(u.getId()).stream()
                            .map(c -> new CourseBriefDto(c.getId(), c.getName()))
                            .collect(Collectors.toList());
                    return new CoordinatorWithCoursesDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail(), courses);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}
