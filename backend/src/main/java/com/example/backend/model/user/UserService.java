package com.example.backend.model.user;

import com.example.backend.model.notification.EmailService;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.auth.DTO.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;


    public void registerUser(RegisterRequest registerRequest) {
        String email = normalizeEmail(registerRequest.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already taken!");
        }

        if (registerRequest.getRoleId() == null) {
            throw new IllegalArgumentException("Role ID must be provided!");
        }

        Role userRole = roleRepository.findById(registerRequest.getRoleId())
                .orElseThrow(() -> new IllegalArgumentException("Role not found!"));

        User user = new User();
        user.setName(registerRequest.getName().trim());
        user.setSurname(registerRequest.getSurname().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setTelNumber(registerRequest.getTelNumber().trim());
        user.setRole(userRole);

        userRepository.save(user);
        emailService.sendWelcomeEmail(user);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("Email not found: " + email));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

}
