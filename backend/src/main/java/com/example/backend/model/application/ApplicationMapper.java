package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {
    @Mapping(source = "user.id", target = "userId")
    ApplicationDto toDto(Application application);

    @Mapping(source = "userId", target = "user.id")
    Application toEntity(ApplicationDto applicationDto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "userId", target = "user.id")
    void updateEntityFromDTO(ApplicationDto dto, @MappingTarget Application entity);
}
