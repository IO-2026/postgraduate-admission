package com.example.backend.model.user;

import com.example.backend.auth.AuthService;
import com.example.backend.auth.DTO.LoginRequest;
import com.example.backend.auth.DTO.RegisterRequest;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.AdminUserDto;
import com.example.backend.model.user.CoordinatorDto;
import com.example.backend.model.user.CoordinatorWithCoursesDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
public class UserController {

    private final UserService userService;
    private final AuthService authService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;

    public UserController(UserService userService, AuthService authService, UserRepository userRepository, RoleRepository roleRepository, CourseRepository courseRepository) {
        this.userService = userService;
        this.authService = authService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.courseRepository = courseRepository;
    }

    @PostMapping("/api/auth/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            return ResponseEntity.ok(authService.loginUser(loginRequest));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @PostMapping("/api/auth/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        userService.registerUser(registerRequest);
        return ResponseEntity.ok("User registered successfully!");
    }

    @GetMapping("/api/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/api/users/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> requestBody) {
        
        String newRole = requestBody.get("roleName");
        if (newRole == null || newRole.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            UserDTO updatedUser = userService.updateUserRole(id, newRole.trim());
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Admin endpoints moved into this controller

    @GetMapping("/api/admin/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsersForAdmin() {
        List<AdminUserDto> users = userRepository.findAll().stream()
                .map(u -> new AdminUserDto(u.getId(), u.getName(), u.getSurname(), u.getEmail(), u.getRole() != null ? u.getRole().getId() : null))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PostMapping("/api/admin/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable("id") Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
            Role coord = roleRepository.findById(3).orElseThrow(() -> new IllegalArgumentException("Coordinator role not found"));
            user.setRole(coord);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(new AdminUserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/api/admin/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable("id") Long id) {
        try {
            User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
            // prevent demotion if user still has assigned courses
            List<Course> assigned = courseRepository.findByCoordinatorId(user.getId());
            if (assigned != null && !assigned.isEmpty()) {
                return ResponseEntity.badRequest().body("Cannot demote user while they have assigned courses. Reassign courses first.");
            }
            Role applicant = roleRepository.findById(1).orElseThrow(() -> new IllegalArgumentException("Applicant role not found"));
            user.setRole(applicant);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(new AdminUserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/api/admin/coordinators")
    public ResponseEntity<List<CoordinatorDto>> getCoordinators() {
        List<CoordinatorDto> dtos = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> new CoordinatorDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/api/admin/coordinators-with-courses")
    public ResponseEntity<List<CoordinatorWithCoursesDto>> getCoordinatorsWithCourses() {
        List<CoordinatorWithCoursesDto> dtos = userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> {
                    List<Course> courses = courseRepository.findByCoordinatorId(u.getId());
                    List<com.example.backend.model.course.CourseBriefDto> briefs = courses.stream()
                            .map(c -> new com.example.backend.model.course.CourseBriefDto(c.getId(), c.getName()))
                            .collect(Collectors.toList());
                    return new CoordinatorWithCoursesDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail(), briefs);
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
}