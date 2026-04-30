package com.example.backend.auth;

import com.example.backend.auth.DTO.JwtResponse;
import com.example.backend.auth.DTO.LoginRequest;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public JwtResponse loginUser(LoginRequest loginRequest) {
        String email = normalizeEmail(loginRequest.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        assert userDetails != null;

        String jwt = jwtUtil.generateToken(userDetails);

        User user = userRepository.findByEmail(email).orElseThrow();
        return new JwtResponse(
                jwt,
                "Bearer",
                user.getId(),
                user.getEmail(),
                user.getRole().getName(),
                user.getName(),
                user.getSurname(),
                user.getTelNumber()
        );
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

}
