package com.example.backend.model.application;

import com.example.backend.model.application.dto.AdmissionSubmitRequest;
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
    Application toEntity(ApplicationDto applicationDto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(source = "userId", target = "user.id")
    void updateEntityFromDTO(ApplicationDto dto, @MappingTarget Application entity);

    @Mapping(source = "details.university", target = "university")
    @Mapping(source = "details.courseId", target = "courseId")
    @Mapping(source = "details.diplomaUrl", target = "diplomaUrl")
    @Mapping(source = "details.notes", target = "notes")
    @Mapping(source = "details.truthfulnessConsent", target = "truthfulnessConsent")
    @Mapping(source = "details.gdprConsent", target = "gdprConsent")
    @Mapping(source = "applicant.dateOfBirth", target = "applicantDateOfBirth")
    @Mapping(source = "applicant.pesel", target = "applicantPesel")
    @Mapping(source = "applicant.address.street", target = "addressStreet")
    @Mapping(source = "applicant.address.postalCode", target = "addressPostalCode")
    @Mapping(source = "applicant.address.city", target = "addressCity")
    @Mapping(source = "education.previousDegree", target = "previousDegree")
    @Mapping(source = "education.fieldOfStudy", target = "fieldOfStudy")
    @Mapping(source = "education.graduationYear", target = "graduationYear")
    @Mapping(target = "submissionDateTime", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isPaid", ignore = true)
    @Mapping(target = "status", ignore = true)
    Application toEntity(AdmissionSubmitRequest request);
}
