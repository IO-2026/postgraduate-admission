package com.example.backend.controller;

import com.example.backend.dto.UserDto;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class UserAdminController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;

    public UserAdminController(UserRepository userRepository, RoleRepository roleRepository, CourseRepository courseRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.courseRepository = courseRepository;
    }

    @GetMapping("/admin/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(u -> new UserDto(u.getId(), u.getName(), u.getSurname(), u.getEmail(), u.getRole() != null ? u.getRole().getId() : null))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/admin/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable("id") Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
            Role coord = roleRepository.findById(3).orElseThrow(() -> new IllegalArgumentException("Coordinator role not found"));
            user.setRole(coord);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(new UserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/demote")
    @Transactional
    public ResponseEntity<?> demoteUser(@PathVariable("id") Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
            // prevent demotion if user still has assigned courses
            java.util.List<Course> assigned = courseRepository.findByCoordinatorId(user.getId());
            if (assigned != null && !assigned.isEmpty()) {
                return ResponseEntity.badRequest().body("Cannot demote user while they have assigned courses. Reassign courses first.");
            }
            Role applicant = roleRepository.findById(1).orElseThrow(() -> new IllegalArgumentException("Applicant role not found"));
            user.setRole(applicant);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(new UserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
