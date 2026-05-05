package com.example.backend.model.application;

import com.example.backend.model.application.dto.AdmissionSubmitRequest;
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

    default Application toEntity(AdmissionSubmitRequest request) {
        if (request == null) return null;

        Application app = new Application();

        var details = request.getDetails();
        app.setUniversity(details.getUniversity());
        app.setCourseId(details.getCourseId());
        app.setDiplomaUrl(details.getDiplomaUrl());
        app.setNotes(details.getNotes());
        app.setTruthfulnessConsent(details.isTruthfulnessConsent());
        app.setGdprConsent(details.isGdprConsent());

        var applicant = request.getApplicant();
        app.setApplicantDateOfBirth(applicant.getDateOfBirth());
        app.setApplicantPesel(applicant.getPesel());

        var address = applicant.getAddress();
        app.setAddressStreet(address.getStreet());
        app.setAddressPostalCode(address.getPostalCode());
        app.setAddressCity(address.getCity());

        var edu = request.getEducation();
        app.setPreviousDegree(edu.getPreviousDegree());
        app.setFieldOfStudy(edu.getFieldOfStudy());
        app.setGraduationYear(edu.getGraduationYear());

        return app;
    }
}
