package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class Setup {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Setup(RoleRepository roleRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    @jakarta.transaction.Transactional
    public void setup() {
        List<String> requiredRoles = List.of("Admin", "Coordinator", "Candidate");

        for (String roleName : requiredRoles) {
            if (roleRepository.findAll().stream().noneMatch(r -> r.getName().equals(roleName))) {
                int nextId = roleRepository.findAll().stream().mapToInt(Role::getId).max().orElse(0) + 1;
                roleRepository.save(new Role(nextId, roleName));
                System.out.println("Ensured role exists: " + roleName);
            }
        }

        // Ensure default admin user exists
        roleRepository.findAll().stream()
                .filter(r -> r.getName().equals("Admin"))
                .findFirst()
                .ifPresent(adminRole -> {
                    if (userRepository.findByEmail("admin@example.com").isEmpty()) {
                        User admin = new User();
                        admin.setName("Admin");
                        admin.setSurname("Systemu");
                        admin.setEmail("admin@example.com");
                        admin.setPassword(passwordEncoder.encode("admin123"));
                        admin.setTelNumber("000000000");
                        admin.setRole(adminRole);
                        userRepository.save(admin);
                        System.out.println("Default admin user created.");
                    }
                });
    }
}
