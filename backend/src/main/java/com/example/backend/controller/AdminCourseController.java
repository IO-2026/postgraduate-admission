package com.example.backend.controller;

import com.example.backend.dto.AssignRequest;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;


@RestController
@RequestMapping("/api")
public class AdminCourseController {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public AdminCourseController(CourseRepository courseRepository, UserRepository userRepository) {
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/admin/courses/{id}/coordinator")
    public ResponseEntity<?> assignCourseCoordinator(@PathVariable("id") Long id, @RequestBody AssignRequest req) {
        try {
            Long coordinatorId = req.getCoordinatorId();
            if (coordinatorId == null) {
                return ResponseEntity.badRequest().body("Coordinator id cannot be null");
            }
            User coordinator = userRepository.findById(coordinatorId).orElseThrow(() -> new IllegalArgumentException("Coordinator not found"));
            Course course = courseRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Course not found"));
            course.setCoordinator(coordinator);
            Course saved = courseRepository.save(course);
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
