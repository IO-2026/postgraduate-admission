package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {
    ApplicationDto toDto(Application application);
    Application toEntity(ApplicationDto applicationDto);
}
