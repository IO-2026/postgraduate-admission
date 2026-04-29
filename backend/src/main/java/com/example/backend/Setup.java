package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class Setup {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final PasswordEncoder passwordEncoder;

    public Setup(RoleRepository roleRepository, UserRepository userRepository, CourseRepository courseRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostConstruct
    @Transactional
    public void setup() {
        // Ensure roles with specific ids exist
        if (roleRepository.findAll().isEmpty()) {
            roleRepository.save(new Role(1, "Candidate"));
            roleRepository.save(new Role(2, "Admin"));
            roleRepository.save(new Role(3, "Coordinator"));
        } else {
            List<String> requiredRoles = List.of("Candidate", "Admin", "Coordinator");
            for (String roleName : requiredRoles) {
                if (roleRepository.findAll().stream().noneMatch(r -> r.getName().equals(roleName))) {
                    int nextId = roleRepository.findAll().stream().mapToInt(Role::getId).max().orElse(0) + 1;
                    roleRepository.save(new Role(nextId, roleName));
                    System.out.println("Ensured role exists: " + roleName);
                }
            }
        }

        // Seed courses if none exist
        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) {
            Course c1 = new Course();
            c1.setName("Informatyka Stosowana");
            c1.setPrice(0.0);
            courseRepository.save(c1);

            Course c2 = new Course();
            c2.setName("Zarządzanie Projektami");
            c2.setPrice(0.0);
            courseRepository.save(c2);
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
