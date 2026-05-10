package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import org.mapstruct.BeanMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring")
public interface ApplicationMapper {

    @Mapping(source = "user.id", target = "userId")
    ApplicationDto toDto(Application application);

    @Mapping(source = "userId", target = "user.id")
    @Mapping(target = "isPaid", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "diploma", ignore = true)
    Application toEntity(ApplicationDto applicationDto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "userId", target = "user.id")
    @Mapping(target = "diploma", ignore = true)
    void updateEntityFromDTO(ApplicationDto dto, @MappingTarget Application entity);
}
