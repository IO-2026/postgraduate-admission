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

        Role userRole = roleRepository.findByName("CANDIDATE")
                .orElseThrow(() -> new IllegalArgumentException("Role CANDIDATE not found!"));

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

    public java.util.List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public UserDTO updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found!"));

        Role newRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role " + roleName + " not found!"));

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return mapToDTO(updatedUser);
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .telNumber(user.getTelNumber())
                .roleName(user.getRole().getName())
                .build();
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

}
