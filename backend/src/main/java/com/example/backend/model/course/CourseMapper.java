package com.example.backend.model.course;

import com.example.backend.model.course.dto.CourseDTO;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface CourseMapper {

    @Mapping(source = "coordinator.id", target = "coordinatorId")
    @Mapping(source = "coordinator.name", target = "coordinatorName")
    @Mapping(source = "coordinator.email", target = "coordinatorEmail")
    CourseDTO toDTO(Course course);

    @Mapping(target = "coordinator", ignore = true)
    @Mapping(target = "placesLimit", source = "placesLimit", defaultValue = "30")
    Course toEntity(CourseDTO dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromDTO(CourseDTO dto, @MappingTarget Course entity);
}
