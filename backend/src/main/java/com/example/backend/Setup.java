package com.example.backend;

import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.Course;
import com.example.backend.model.CourseRepository;
import com.example.backend.model.Cohort;
import com.example.backend.model.CohortRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class Setup {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CohortRepository cohortRepository;

    public Setup(RoleRepository roleRepository, UserRepository userRepository, CourseRepository courseRepository, CohortRepository cohortRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.cohortRepository = cohortRepository;
    }

    @PostConstruct
    public void setup() {
        System.out.println("Setup");
        List<Role> roles = roleRepository.findAll();
        System.out.println(roles);

        if (roles.isEmpty()) {
            roleRepository.save(new Role(1, "ADMIN"));
            roleRepository.save(new Role(2, "COORDINATOR"));
            roleRepository.save(new Role(3, "APPLICANT"));
        }

        List<Course> courses = courseRepository.findAll();
        if (courses.isEmpty()) {
            courseRepository.save(new Course(null, "Informatyka Stosowana"));
            courseRepository.save(new Course(null, "Zarządzanie Projektami"));
            courses = courseRepository.findAll();
        }

        List<Cohort> cohorts = cohortRepository.findAll();
        if (cohorts.isEmpty()) {
            // assign first cohort to first course, second cohort to second course (if available)
            Course first = courses.size() > 0 ? courses.get(0) : null;
            Course second = courses.size() > 1 ? courses.get(1) : first;
            if (first != null) cohortRepository.save(new Cohort(null, "Kohorta 2024/2025", first, null));
            if (second != null) cohortRepository.save(new Cohort(null, "Kohorta 2025/2026", second, null));
        }

        List<User> users = userRepository.findAll();
        System.out.println(users);

    }

}
