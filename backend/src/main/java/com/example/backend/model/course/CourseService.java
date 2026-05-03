package com.example.backend.model.course;

import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.user.UserRepository;
import com.example.backend.model.user.UserService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.CandidateWithApplicationDto;
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

    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(courseMapper::toDTO)
                .collect(Collectors.toList());
    }

    public CourseDTO saveCourse(CourseDTO courseDTO) {
        Course course = courseMapper.toEntity(courseDTO);
        if (courseDTO.getCoordinatorId() != null) {
            User u = userRepository.findById(courseDTO.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Coordinator not found"));
            course.setCoordinator(u);
        }
        return courseMapper.toDTO(courseRepository.save(course));
    }

    public void deleteCourse(Long id) {
        courseRepository.deleteById(id);
    }

    public List<CourseDTO> getCoursesOfCoordinator(Long id) {
        return courseRepository.findAllByCoordinatorId(id).stream()
                .map(this::mapToDTO)
                .sorted(Comparator.comparing(CourseDTO::getName))
                .collect(Collectors.toList());
    }

    public CourseDTO updateCourse(Long id, CourseDTO courseDTO) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        course.setName(courseDTO.getName());
        course.setDescription(courseDTO.getDescription());
        course.setPrice(courseDTO.getPrice());
        course.setRecruitmentStart(courseDTO.getRecruitmentStart());
        course.setRecruitmentEnd(courseDTO.getRecruitmentEnd());

        if (courseDTO.getCoordinatorId() != null) {
            User u = userRepository.findById(courseDTO.getCoordinatorId())
                    .orElseThrow(() -> new RuntimeException("Coordinator not found"));
            course.setCoordinator(u);
        }

        return courseMapper.toDTO(courseRepository.save(course));
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
        return applicationService.getAllApplications().stream()
                .filter(a -> Objects.equals(a.getCourseId(), courseId))
                .map(a -> userService.mapToCandidateWithApplicationDto(a.getUser(), a))
                .sorted(Comparator.comparing(CandidateWithApplicationDto::getSurname))
                .collect(Collectors.toList());
    }
}
