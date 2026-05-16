package com.example.backend.model.course;

import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.user.UserMapper;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.user.UserService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.dto.CandidateWithApplicationDto;
import com.example.backend.model.course.dto.CourseDTO;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final ApplicationService applicationService;
    private final UserService userService;
    private final CourseMapper courseMapper;
    private final UserMapper userMapper;

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toDTO)
                .sorted(Comparator.comparing(CourseDTO::getName))
                .collect(Collectors.toList());
    }

    public CourseDTO getCourseById(Long id) {
        return courseRepository.findById(id).map(courseMapper::toDTO).orElse(null);
    }

    public CourseDTO saveCourse(CourseDTO courseDTO) {
        Course course = courseMapper.toEntity(courseDTO);
        if (courseDTO.getCoordinatorId() != null) {
            User u = userRepository.findById(courseDTO.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Koordynator nie znaleziony"));
            course.setCoordinator(u);
        }
        return courseMapper.toDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public List<CourseDTO> getCoursesOfCoordinator(Long id) {
        return courseRepository.findAllByCoordinatorId(id).stream()
                .map(courseMapper::toDTO)
                .sorted(Comparator.comparing(CourseDTO::getName))
                .collect(Collectors.toList());
    }

    public void updateCourse(Long id, CourseDTO courseDTO) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Kurs nie znaleziony"));

        if (courseDTO.getCoordinatorId() != null) {
            User u = userRepository.findById(courseDTO.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Koordynator nie znaleziony"));
            course.setCoordinator(u);
        }
        courseMapper.updateEntityFromDTO(courseDTO, course);
        courseMapper.toDTO(courseRepository.save(course));
    }


    @Transactional
    public Course assignCoordinator(Long courseId, Long coordinatorId) {
        if (coordinatorId == null) {
            throw new IllegalArgumentException("Identyfikator koordynatora nie może być pusty");
        }

        User coordinator = userRepository.findById(coordinatorId)
                .orElseThrow(() -> new RuntimeException("Koordynator nie znaleziony"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Kurs nie znaleziony"));

        course.setCoordinator(coordinator);
        return courseRepository.save(course);
    }

    public List<CandidateWithApplicationDto> getCourseCandidates(Long courseId) {
        return applicationService.getAllApplications().stream()
                .filter(a -> Objects.equals(a.getCourseId(), courseId))
                .map(a -> userMapper.toCandidateWithApplicationDto(a.getUser(), a))
                .sorted(Comparator.comparing(CandidateWithApplicationDto::getSurname))
                .collect(Collectors.toList());
    }
}
