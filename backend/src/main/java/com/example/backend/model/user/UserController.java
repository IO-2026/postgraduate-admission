package com.example.backend.model.user;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.security.AuthService;
import com.example.backend.security.DTO.JwtResponse;
import com.example.backend.security.DTO.LoginRequest;
import com.example.backend.security.DTO.RegisterRequest;
import com.example.backend.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {

    private final UserService userService;
    private final AuthService authService;

    public UserController(UserService userService, AuthService authService) {
        this.userService = userService;
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        return ResponseEntity.ok(authService.loginUser(loginRequest));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest registerRequest) {
        userService.registerUser(registerRequest);
        return ResponseEntity.ok("User registered successfully!");
    }
}