package com.example.backend.model.course;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    @GetMapping("/courses")
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @GetMapping("/courses/{id}")
    public ResponseEntity<CourseDTO> getCourseById(@PathVariable Long id) {
        System.out.println(courseService.getCourseById(id));
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(@RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO savedCourse = courseService.saveCourse(courseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCourse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + (e.getCause() != null ? " Cause: " + e.getCause().getMessage() : ""));
        }
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO updatedCourse = courseService.updateCourse(id, courseDTO);
            return ResponseEntity.ok(updatedCourse);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Admin assignment endpoint (kept under /api/admin/... by the front-end)
    @PostMapping("/admin/courses/{id}/coordinator")
    public ResponseEntity<?> assignCourseCoordinator(@PathVariable("id") Long id, @RequestBody AssignRequest req) {
        try {
            Course saved = courseService.assignCoordinator(id, req.getCoordinatorId());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public List<CourseDTO> getCoursesOfCoordinator(@RequestParam Long coordinatorId) {
        return courseService.getCoursesOfCoordinator(coordinatorId);
    }
}
