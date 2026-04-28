package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class Setup {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    public Setup(RoleRepository roleRepository, UserRepository userRepository, CourseRepository courseRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
    }

    @PostConstruct
    public void setup() {
        System.out.println("Setup");
        List<Role> roles = roleRepository.findAll();
        System.out.println(roles);

        if (roles.isEmpty()) {
            roleRepository.save(new Role(1, "Candidate"));
            roleRepository.save(new Role(2, "Admin"));
            roleRepository.save(new Role(3, "Coordinator"));
        }

        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) {
            courseRepository.save(new Course(null, "Informatyka Stosowana"));
            courseRepository.save(new Course(null, "Zarządzanie Projektami"));
        }

        List<User> users = userRepository.findAll();
        System.out.println(users);

    }

}
