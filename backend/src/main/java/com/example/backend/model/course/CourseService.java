package com.example.backend.model.course;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;

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
                course.setCoordinatorId(courseDTO.getCoordinatorId());
            }
            Course updatedCourse = courseRepository.save(course);
            return mapToDTO(updatedCourse);
        }).orElseThrow(() -> new RuntimeException("Course not found"));
    }

    private CourseDTO mapToDTO(Course course) {
        return CourseDTO.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .price(course.getPrice())
                .recruitmentStart(course.getRecruitmentStart())
                .recruitmentEnd(course.getRecruitmentEnd())
                .coordinatorId(course.getCoordinatorId())
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
            course.setCoordinatorId(courseDTO.getCoordinatorId());
        }
        return course;
    }
}
