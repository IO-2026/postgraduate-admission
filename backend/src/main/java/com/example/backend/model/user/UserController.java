package com.example.backend.model.user;

import com.example.backend.auth.AuthService;
import com.example.backend.auth.DTO.LoginRequest;
import com.example.backend.auth.DTO.RegisterRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuthService authService;


    @PostMapping("/auth/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            return ResponseEntity.ok(authService.loginUser(loginRequest));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
        }
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        userService.registerUser(registerRequest);
        return ResponseEntity.ok("User registered successfully!");
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDTO> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> requestBody) {
        
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

    @GetMapping("/admin/users")
    public ResponseEntity<List<AdminUserDto>> getAllUsersForAdmin() {
        return ResponseEntity.ok(userService.getAllAdminUsers());
    }

    @PostMapping("/admin/users/{id}/promote")
    public ResponseEntity<?> promoteUser(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(userService.promoteToCoordinator(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/demote")
    public ResponseEntity<?> demoteUser(@PathVariable("id") Long id) {
        try {
            return ResponseEntity.ok(userService.demoteToApplicant(id));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/coordinators")
    public ResponseEntity<List<CoordinatorDto>> getCoordinators() {
        return ResponseEntity.ok(userService.getAllCoordinators());
    }

    @GetMapping("/admin/coordinators-with-courses")
    public ResponseEntity<List<CoordinatorWithCoursesDto>> getCoordinatorsWithCourses() {
        return ResponseEntity.ok(userService.getCoordinatorsWithCourses());
    }
}