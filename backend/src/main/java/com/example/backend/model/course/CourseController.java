package com.example.backend.model.course;

import com.example.backend.model.course.dto.AssignRequest;
import com.example.backend.model.user.dto.CandidateWithApplicationDto;
import com.example.backend.model.course.dto.CourseDTO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
        return ResponseEntity.ok(courseService.getCourseById(id));
    }

    @PostMapping("/courses")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> createCourse(@Valid @RequestBody CourseDTO courseDTO) {
        try {
            CourseDTO savedCourse = courseService.saveCourse(courseDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedCourse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd: " + e.getMessage() + (e.getCause() != null ? " Przyczyna: " + e.getCause().getMessage() : ""));
        }
    }

    @DeleteMapping("/courses/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Błąd: " + e.getMessage());
        }
    }

    @PatchMapping("/courses/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> updateCourse(@PathVariable Long id, @Valid @RequestBody CourseDTO courseDTO) {
        courseService.updateCourse(id, courseDTO);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/admin/courses/{id}/coordinator")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> assignCourseCoordinator(@PathVariable Long id, @RequestBody AssignRequest req) {
        try {
            Course saved = courseService.assignCoordinator(id, req.getCoordinatorId());
            return ResponseEntity.ok(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/courses/ofCoordinator")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public List<CourseDTO> getCoursesOfCoordinator(@RequestParam Long coordinatorId) {
        return courseService.getCoursesOfCoordinator(coordinatorId);
    }

    @GetMapping("/courses/{id}/candidates")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public List<CandidateWithApplicationDto> getCourseCandidates(@PathVariable Long id) {
        return courseService.getCourseCandidates(id);
    }

    @PostMapping("/courses/{id}/close")
    @PreAuthorize("hasAnyRole('Coordinator', 'Admin')")
    public ResponseEntity<?> closeRecruitment(@PathVariable Long id) {
        courseService.closeRecruitment(id);
        return ResponseEntity.ok().build();
    }
}
