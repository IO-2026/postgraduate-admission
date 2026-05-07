package com.example.backend.model.user;

import com.example.backend.auth.DTO.RegisterRequest;
import com.example.backend.model.application.Application;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.dto.CourseBriefDto;
import com.example.backend.model.user.dto.AdminUserDto;
import com.example.backend.model.user.dto.CoordinatorWithCoursesDto;
import com.example.backend.model.user.dto.UserDTO;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "authorities", ignore = true)
    User toEntity(RegisterRequest registerRequest);

    @Mapping(source = "role.name", target = "roleName")
    UserDTO toDTO(User user);

    @Mapping(source = "u.id", target = "id")
    @Mapping(source = "u.email", target = "email")
    @Mapping(target = "name", expression = "java(u.getName() + \" \" + u.getSurname())")
    @Mapping(source = "courses", target = "courses")
    CoordinatorWithCoursesDto toCoordinatorWithCoursesDto(User u, List<Course> courses);

    @Mapping(source = "role.id", target = "roleId")
    AdminUserDto toAdminDto(User user);

    @Mapping(source = "user.id", target = "id")
    @Mapping(source = "application.id", target = "applicationId")
    CandidateWithApplicationDto toCandidateWithApplicationDto(User user, Application application);

    CourseBriefDto toCourseBriefDto(Course course);
}
