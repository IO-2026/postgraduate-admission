package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class Setup {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public Setup(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
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

    }

}
