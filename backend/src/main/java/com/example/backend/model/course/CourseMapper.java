package com.example.backend.model.course;

import com.example.backend.model.course.dto.CourseDTO;
import org.springframework.stereotype.Component;

@Component
public class CourseMapper {
    public CourseDTO toDTO(Course course) {
        if (course == null) return null;

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

    public Course toEntity(CourseDTO dto) {
        if (dto == null) return null;

        Course course = new Course();
        course.setId(dto.getId());
        course.setName(dto.getName());
        course.setDescription(dto.getDescription());
        course.setPrice(dto.getPrice());
        course.setRecruitmentStart(dto.getRecruitmentStart());
        course.setRecruitmentEnd(dto.getRecruitmentEnd());
        return course;
    }
}
