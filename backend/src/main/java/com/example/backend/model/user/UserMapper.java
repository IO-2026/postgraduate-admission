package com.example.backend.model.user;

import com.example.backend.auth.DTO.RegisterRequest;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.dto.CourseBriefDto;
import com.example.backend.model.user.dto.AdminUserDto;
import com.example.backend.model.user.dto.CoordinatorWithCoursesDto;
import com.example.backend.model.user.dto.UserDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class UserMapper {

    public User toEntity(RegisterRequest registerRequest) {
        if (registerRequest == null) return null;

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setSurname(registerRequest.getSurname());
        user.setTelNumber(registerRequest.getTelNumber());
        user.setEmail(registerRequest.getEmail());

        return user;
    }

    public UserDTO toDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .surname(user.getSurname())
                .email(user.getEmail())
                .telNumber(user.getTelNumber())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .build();
    }

    public CoordinatorWithCoursesDto toCoordinatorWithCoursesDto(User u, List<Course> courses) {
        if (u == null) return null;

        List<CourseBriefDto> briefs = courses.stream()
                .map(c -> new CourseBriefDto(c.getId(), c.getName()))
                .toList();

        return new CoordinatorWithCoursesDto(
                u.getId(),
                u.getName() + " " + u.getSurname(),
                u.getEmail(),
                briefs
        );
    }

    public AdminUserDto toAdminDto(User user) {
        if (user == null) return null;

        return new AdminUserDto(
                user.getId(),
                user.getName(),
                user.getSurname(),
                user.getEmail(),
                // Bezpieczny null-check dla roli
                user.getRole() != null ? user.getRole().getId() : null
        );
    }
}
