package com.example.backend.model.course;

import com.example.backend.model.course.dto.CourseDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    @Mapping(source = "coordinator.id", target = "coordinatorId")
    @Mapping(source = "coordinator.name", target = "coordinatorName")
    @Mapping(source = "coordinator.email", target = "coordinatorEmail")
    CourseDTO toDTO(Course course);

    @Mapping(target = "coordinator", ignore = true)
    Course toEntity(CourseDTO dto);
}
