package com.example.backend.model.user;

import com.example.backend.model.course.Course;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.auth.DTO.RegisterRequest;
import com.example.backend.model.user.dto.AdminUserDto;
import com.example.backend.model.user.dto.CoordinatorDto;
import com.example.backend.model.user.dto.CoordinatorWithCoursesDto;
import com.example.backend.model.user.dto.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final com.example.backend.model.course.CourseRepository courseRepository;
    private final UserMapper userMapper;


    public void registerUser(RegisterRequest registerRequest) {
        String email = normalizeEmail(registerRequest.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("E-mail jest już zajęty!");
        }
        User user = userMapper.toEntity(registerRequest);

        Role userRole = roleRepository.findByName("Candidate")
                .orElseThrow(() -> new IllegalArgumentException("Rola Candidate nie znaleziona!"));

        user.setRole(userRole);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        userRepository.save(user);
        emailService.sendWelcomeEmail(user);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("E-mail nie znaleziony: " + email));
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    public UserDTO updateUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Użytkownik nie znaleziony!"));

        Role newRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Rola " + roleName + " nie znaleziona!"));

        // if user is currently a coordinator and new role is not coordinator, prevent demotion while courses assigned
        boolean isCurrentlyCoordinator = user.getRole() != null && Integer.valueOf(3).equals(user.getRole().getId());
        boolean willBeCoordinator = newRole != null && Integer.valueOf(3).equals(newRole.getId());
        if (isCurrentlyCoordinator && !willBeCoordinator) {
            java.util.List<com.example.backend.model.course.Course> assigned = courseRepository.findByCoordinatorId(userId);
            if (assigned != null && !assigned.isEmpty()) {
                throw new IllegalArgumentException("Nie można zdegradować użytkownika, który ma przypisane kursy. Najpierw przełóż kursy.");
            }
        }

        user.setRole(newRole);
        User updatedUser = userRepository.save(user);
        return userMapper.toDTO(updatedUser);
    }


    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }

    public List<AdminUserDto> getAllAdminUsers() {
        return userRepository.findAll().stream()
                .map(userMapper::toAdminDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminUserDto promoteToCoordinator(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Użytkownik nie znaleziony"));
        Role coord = roleRepository.findById(3)
                .orElseThrow(() -> new IllegalArgumentException("Rola koordynatora nie znaleziona"));

        user.setRole(coord);
        User savedUser = userRepository.save(user);
        return userMapper.toAdminDto(savedUser);
    }

    @Transactional
    public AdminUserDto demoteToApplicant(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Użytkownik nie znaleziony"));

        List<Course> assigned = courseRepository.findByCoordinatorId(user.getId());
        if (assigned != null && !assigned.isEmpty()) {
            throw new IllegalStateException("Nie można zdegradować użytkownika, który ma przypisane kursy.");
        }

        Role applicant = roleRepository.findById(1)
                .orElseThrow(() -> new IllegalArgumentException("Rola Candidate nie znaleziona"));

        user.setRole(applicant);
        User savedUser = userRepository.save(user);
        return userMapper.toAdminDto(savedUser);
    }

    public List<CoordinatorDto> getAllCoordinators() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> new CoordinatorDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail()))
                .collect(Collectors.toList());
    }

    public List<CoordinatorWithCoursesDto> getCoordinatorsWithCourses() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getId() == 3)
                .map(u -> {
                    List<Course> courses = courseRepository.findByCoordinatorId(u.getId());
                    return userMapper.toCoordinatorWithCoursesDto(u, courses);
                })
                .toList();
    }
}
