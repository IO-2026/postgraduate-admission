package com.example.backend.services;

import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseMapper;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.course.CourseService;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.course.dto.CourseDTO;
import com.example.backend.model.user.UserMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CourseServiceTest {
    @Mock
    private CourseRepository courseRepository;

    @Mock
    private ApplicationService applicationService;

    @Mock
    private CourseMapper courseMapper;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private CourseService courseService;

    @Test
    void shouldCloseRecruitmentSuccessfully() {
        Long courseId = 1L;
        Course course = new Course();
        course.setId(courseId);
        course.setIsRecruitmentOpen(true);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));


        courseService.closeRecruitment(courseId);


        assertFalse(course.getIsRecruitmentOpen());
        verify(courseRepository, times(1)).save(course);
    }

    @Test
    void shouldThrowExceptionWhenCourseNotFound() {
        Long courseId = 99L;
        when(courseRepository.findById(courseId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> courseService.closeRecruitment(courseId));

        verify(courseRepository, never()).save(any());
    }

    @Test
    void shouldThrowExceptionWhenRecruitmentIsAlreadyClosed() {

        Long courseId = 1L;
        Course course = new Course();
        course.setId(courseId);
        course.setIsRecruitmentOpen(false);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        assertThrows(IllegalStateException.class, () -> courseService.closeRecruitment(courseId));

        verify(courseRepository, never()).save(any());
    }

    @Test
    void shouldRecalculateStatusesAfterUpdatingPlacesLimit() {
        Long courseId = 5L;
        Course course = new Course();
        course.setId(courseId);
        course.setName("Informatyka");
        course.setPlacesLimit(10);

        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));
        when(courseRepository.save(course)).thenReturn(course);
        when(courseMapper.toDTO(course)).thenReturn(CourseDTO.builder().id(courseId).build());

        CourseDTO dto = CourseDTO.builder()
                .name("Informatyka")
                .placesLimit(8)
                .academicYear(2026)
                .build();

        courseService.updateCourse(courseId, dto);

        verify(applicationService).recalculateCourseStatuses(courseId);
        verify(courseRepository).save(course);
    }
}
