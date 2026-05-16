package com.example.backend.model.user;

import com.example.backend.auth.AuthService;
import com.example.backend.auth.DTO.LoginRequest;
import com.example.backend.auth.DTO.RegisterRequest;
import com.example.backend.model.user.dto.AdminUserDto;
import com.example.backend.model.user.dto.CoordinatorDto;
import com.example.backend.model.user.dto.CoordinatorWithCoursesDto;
import com.example.backend.model.user.dto.UserDTO;
import com.example.backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
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
    private final JwtUtil jwtUtil;

    @PostMapping("/auth/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest, HttpServletRequest request) {
        try {
            AuthService.LoginResult result = authService.loginUser(loginRequest);
            ResponseCookie cookie = buildJwtCookie(result.jwt(), jwtUtil.getExpiration() / 1000, request.isSecure());
            return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(result.response());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Nieprawidłowe dane logowania");
        }
    }

    @GetMapping("/users/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getMe(@AuthenticationPrincipal UserDetails principal) {
        String email = principal.getUsername();
        UserDTO user = userService.getUserByEmail(email);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        ResponseCookie cookie = buildJwtCookie("", 0, request.isSecure());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    private ResponseCookie buildJwtCookie(String value, long maxAgeSeconds, boolean secure) {
        return ResponseCookie.from("jwt", value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        userService.registerUser(registerRequest);
        return ResponseEntity.ok("Użytkownik zarejestrowany pomyślnie!");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('Admin') or #id == authentication.principal.id")
    public ResponseEntity<UserDTO> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('Admin')")
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
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<AdminUserDto>> getAllUsersForAdmin() {
        return ResponseEntity.ok(userService.getAllAdminUsers());
    }

    @PostMapping("/admin/users/{id}/promote")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> promoteUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.promoteToCoordinator(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/users/{id}/demote")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> demoteUser(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(userService.demoteToApplicant(id));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/coordinators")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<CoordinatorDto>> getCoordinators() {
        return ResponseEntity.ok(userService.getAllCoordinators());
    }

    @GetMapping("/admin/coordinators-with-courses")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<List<CoordinatorWithCoursesDto>> getCoordinatorsWithCourses() {
        return ResponseEntity.ok(userService.getCoordinatorsWithCourses());
    }
}