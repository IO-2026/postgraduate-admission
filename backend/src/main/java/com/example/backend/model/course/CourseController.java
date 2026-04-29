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

import java.util.List;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.user.User;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import com.example.backend.model.course.AssignRequest;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.course.Course;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @GetMapping("/courses")
    public ResponseEntity<List<CourseDTO>> getAllCourses() {
        return ResponseEntity.ok(courseService.getAllCourses());
    }

    @PostMapping("/courses")
    public ResponseEntity<?> createCourse(@RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO savedCourse = courseService.saveCourse(courseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCourse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + (e.getCause() != null ? " Cause: " + e.getCause().getMessage() : ""));
        }
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/courses/{id}")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO updatedCourse = courseService.updateCourse(id, courseDTO);
            return ResponseEntity.ok(updatedCourse);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    // Admin assignment endpoint (kept under /api/admin/... by the front-end)
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
