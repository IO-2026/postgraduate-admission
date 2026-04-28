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

    public Setup(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    public void setup() {
        System.out.println("Setup roles initialization...");

        List<String> requiredRoles = List.of("ADMIN", "COORDINATOR", "CANDIDATE");
        for (String roleName : requiredRoles) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                int nextId = roleRepository.findAll().stream().mapToInt(Role::getId).max().orElse(0) + 1;
                roleRepository.save(new Role(nextId, roleName));
                System.out.println("Created role: " + roleName + " with ID: " + nextId);
            }
        }

        List<Role> roles = roleRepository.findAll();
        System.out.println("Current roles: " + roles);

        User admin = null;
        Role adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new IllegalStateException("ADMIN role should have been created!"));
        if (userRepository.findByEmail("admin@example.com").isEmpty()) {
            admin = new User();
            System.out.println(">>> Creating default admin user: admin@example.com / admin123");
        } else {
            admin = userRepository.findByEmail("admin@example.com").get();
            System.out.println(">>> Updating admin user to default");
        }

        admin.setName("Admin");
        admin.setSurname("Systemu");
        admin.setEmail("admin@example.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setTelNumber("000000000");
        admin.setRole(adminRole);

        admin.setPassword(passwordEncoder.encode("admin123"));
        userRepository.save(admin);
    }

}
