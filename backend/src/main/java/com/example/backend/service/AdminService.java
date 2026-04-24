package com.example.backend.service;

import com.example.backend.dto.AssignmentDto;
import com.example.backend.dto.CohortBriefDto;
import com.example.backend.dto.CourseBriefDto;
import com.example.backend.dto.CoordinatorWithCohortsDto;
import com.example.backend.dto.CoordinatorDto;
import com.example.backend.dto.UserDto;

import com.example.backend.model.Course;
import com.example.backend.model.Cohort;
import com.example.backend.model.CourseRepository;
import com.example.backend.model.CohortRepository;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.role.Role;
import com.example.backend.model.role.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CohortRepository cohortRepository;
    private final RoleRepository roleRepository;

    public AdminService(UserRepository userRepository, CourseRepository courseRepository, CohortRepository cohortRepository, RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.cohortRepository = cohortRepository;
        this.roleRepository = roleRepository;
    }

    public List<Course> getAllCourses() {
        return courseRepository.findAll();
    }

    public List<Cohort> getAllCohorts() {
        return cohortRepository.findAll();
    }

    @Transactional
    public Course assignCourseCoordinator(Long courseId, Long coordinatorId) {
        User coordinator = userRepository.findById(coordinatorId).orElseThrow(() -> new IllegalArgumentException("Coordinator not found"));
        Course course = courseRepository.findById(courseId).orElseThrow(() -> new IllegalArgumentException("Course not found"));
        course.setCoordinator(coordinator);
        return courseRepository.save(course);
    }



    public List<CoordinatorDto> getCoordinatorsDto() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getName() != null && u.getRole().getName().toUpperCase().contains("COORDINATOR"))
                .map(u -> new CoordinatorDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AssignmentDto assignCoordinator(Long coordinatorId, Long courseId, Long cohortId) {
        User coordinator = userRepository.findById(coordinatorId).orElseThrow(() -> new IllegalArgumentException("Coordinator not found"));
        Cohort cohort = cohortRepository.findById(cohortId).orElseThrow(() -> new IllegalArgumentException("Cohort not found"));

        if (cohort.getCourse() != null && !cohort.getCourse().getId().equals(courseId)) {
            throw new IllegalArgumentException("Cohort does not belong to the given course");
        }

        cohort.setCoordinator(coordinator);
        Cohort saved = cohortRepository.save(cohort);

        return new AssignmentDto(
                saved.getId(),
                saved.getCoordinator().getId(),
                saved.getCoordinator().getName() + " " + saved.getCoordinator().getSurname(),
                saved.getCoordinator().getEmail(),
                saved.getCourse().getId(),
                saved.getCourse().getName(),
                saved.getId(),
                saved.getName()
        );
    }

    public List<AssignmentDto> getAssignments() {
        return cohortRepository.findAll().stream()
                .filter(c -> c.getCoordinator() != null)
                .map(c -> new AssignmentDto(
                        c.getId(),
                        c.getCoordinator().getId(),
                        c.getCoordinator().getName() + " " + c.getCoordinator().getSurname(),
                        c.getCoordinator().getEmail(),
                        c.getCourse().getId(),
                        c.getCourse().getName(),
                        c.getId(),
                        c.getName()
                ))
                .collect(Collectors.toList());
    }

    public List<CoordinatorWithCohortsDto> getCoordinatorsWithCohorts() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && u.getRole().getName() != null && u.getRole().getName().toUpperCase().contains("COORDINATOR"))
                .map(u -> {
                    List<CohortBriefDto> cohorts = cohortRepository.findByCoordinator(u).stream()
                            .map(c -> new CohortBriefDto(c.getId(), c.getName(), c.getCourse() != null ? c.getCourse().getId() : null, c.getCourse() != null ? c.getCourse().getName() : null))
                            .collect(Collectors.toList());
                    java.util.List<CourseBriefDto> courses = courseRepository.findByCoordinator(u).stream()
                            .map(c -> new CourseBriefDto(c.getId(), c.getName()))
                            .collect(Collectors.toList());
                    return new CoordinatorWithCohortsDto(u.getId(), u.getName() + " " + u.getSurname(), u.getEmail(), cohorts, courses);
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void unassignCohort(Long cohortId) {
        Cohort cohort = cohortRepository.findById(cohortId).orElseThrow(() -> new IllegalArgumentException("Cohort not found"));
        cohort.setCoordinator(null);
        cohortRepository.save(cohort);
    }

    @Transactional
    public UserDto promoteUserToCoordinator(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role coord = roleRepository.findById(3).orElseThrow(() -> new IllegalArgumentException("Coordinator role not found"));
        user.setRole(coord);
        User saved = userRepository.save(user);
        return new UserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null);
    }

    @Transactional
    public UserDto demoteUserToApplicant(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        Role applicant = roleRepository.findById(1).orElseThrow(() -> new IllegalArgumentException("Applicant role not found"));
        user.setRole(applicant);
        // unassign cohorts from this user
        List<Cohort> assigned = cohortRepository.findByCoordinator(user);
        for (Cohort c : assigned) {
            c.setCoordinator(null);
            cohortRepository.save(c);
        }
        User saved = userRepository.save(user);
        return new UserDto(saved.getId(), saved.getName(), saved.getSurname(), saved.getEmail(), saved.getRole() != null ? saved.getRole().getId() : null);
    }

    public List<UserDto> searchUsers(String q) {
        if (q == null || q.trim().isEmpty()) {
            return userRepository.findAll().stream()
                    .map(u -> new UserDto(u.getId(), u.getName(), u.getSurname(), u.getEmail(), u.getRole() != null ? u.getRole().getId() : null))
                    .collect(Collectors.toList());
        }
        String term = q.trim();
        return userRepository.findByNameContainingIgnoreCaseOrSurnameContainingIgnoreCaseOrEmailContainingIgnoreCase(term, term, term).stream()
                .map(u -> new UserDto(u.getId(), u.getName(), u.getSurname(), u.getEmail(), u.getRole() != null ? u.getRole().getId() : null))
                .collect(Collectors.toList());
    }
}
