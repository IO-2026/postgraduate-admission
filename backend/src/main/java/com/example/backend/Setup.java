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
        System.out.println("Setup");
        List<Role> roles = roleRepository.findAll();
        System.out.println(roles);

        List<User> users = userRepository.findAll();
        System.out.println(users);

    }

}
