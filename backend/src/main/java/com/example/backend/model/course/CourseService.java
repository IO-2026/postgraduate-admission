package com.example.backend.model.course;

import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.user.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final UserService userService;

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public CourseDTO saveCourse(CourseDTO courseDTO) {
        Course course = mapToEntity(courseDTO);
        Course savedCourse = courseRepository.save(course);
        return mapToDTO(savedCourse);
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public List<CourseDTO> getCoursesOfCoordinator(Long id) {
        return courseRepository.findAllByCoordinatorId(id).stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public CourseDTO updateCourse(Long id, CourseDTO courseDTO) {
        return courseRepository.findById(id).map(course -> {
            course.setName(courseDTO.getName());
            course.setDescription(courseDTO.getDescription());
            course.setPrice(courseDTO.getPrice());
            if (courseDTO.getRecruitmentStart() != null) {
                course.setRecruitmentStart(courseDTO.getRecruitmentStart());
            }
            if (courseDTO.getRecruitmentEnd() != null) {
                course.setRecruitmentEnd(courseDTO.getRecruitmentEnd());
            }
            if (courseDTO.getCoordinatorId() != null) {
                // fetch user and set as coordinator
                User u = userRepository.findById(courseDTO.getCoordinatorId())
                        .orElseThrow(() -> new RuntimeException("Coordinator user not found"));
                course.setCoordinator(u);
            }
            Course updatedCourse = courseRepository.save(course);
            return mapToDTO(updatedCourse);
        }).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    private CourseDTO mapToDTO(Course course) {
        Long coordId = course.getCoordinator() != null ? course.getCoordinator().getId() : null;
        return CourseDTO.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .price(course.getPrice())
                .recruitmentStart(course.getRecruitmentStart())
                .recruitmentEnd(course.getRecruitmentEnd())
                .coordinatorId(coordId)
                .build();
    }

    private Course mapToEntity(CourseDTO courseDTO) {
        Course course = new Course();
        course.setId(courseDTO.getId());
        course.setName(courseDTO.getName());
        course.setDescription(courseDTO.getDescription());
        course.setPrice(courseDTO.getPrice());
        if (courseDTO.getRecruitmentStart() != null) {
            course.setRecruitmentStart(courseDTO.getRecruitmentStart());
        }
        if (courseDTO.getRecruitmentEnd() != null) {
            course.setRecruitmentEnd(courseDTO.getRecruitmentEnd());
        }
        if (courseDTO.getCoordinatorId() != null) {
            User u = userRepository.findById(courseDTO.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Coordinator user not found"));
            course.setCoordinator(u);
        }
        return course;
    }

    @Transactional
    public Course assignCoordinator(Long courseId, Long coordinatorId) {
        if (coordinatorId == null) {
            throw new IllegalArgumentException("Coordinator id cannot be null");
        }

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new RuntimeException("Coordinator not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        course.setCoordinator(coordinator);
        return courseRepository.save(course);
    }

    public List<CandidateWithApplicationDto> getCourseCandidates(Long courseId) {
        return applicationRepository.findAll().stream()
                .filter(a -> Objects.equals(a.getCourseId(), courseId))
                .map(a -> userService.mapToCandidateWithApplicationDto(a.getUser(), a))
                .collect(Collectors.toList());
    }
}
