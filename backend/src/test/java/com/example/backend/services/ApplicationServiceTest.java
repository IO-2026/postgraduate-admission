package com.example.backend.services;


import com.example.backend.model.application.dto.AdmissionAddressDto;
import com.example.backend.model.application.dto.AdmissionApplicantDto;
import com.example.backend.model.application.dto.AdmissionDetailsDto;
import com.example.backend.model.application.dto.AdmissionEducationDto;
import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.application.ApplicationStatus;
import com.example.backend.model.application.storage.StorageService;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ApplicationServiceTest {
    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void shouldSuccessfullySaveApplication() {
        // GIVEN: Przygotowujemy dane wejściowe
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();
        request.setUserId(1L);

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
        applicant.setName("Jan");
        applicant.setSurname("Kowalski");
        applicant.setTelNumber("123456789");
        applicant.setPesel("44051401458");
        applicant.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        applicant.setAddress(address);

        AdmissionEducationDto education = new AdmissionEducationDto();
        education.setPreviousDegree("Inżynier");
        education.setFieldOfStudy("Informatyka");
        education.setGraduationYear(2015);

        AdmissionDetailsDto details = new AdmissionDetailsDto();
        details.setUniversity("Test University");
        details.setCourseId(100L);
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("student@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        when(storageService.uploadDiploma(any(byte[].class), eq("application/pdf"), any(String.class)))
            .thenReturn("diplomas/1/1/test.pdf");

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "diploma.pdf",
            "application/pdf",
            "%PDF-1.4 test".getBytes()
        );

        // WHEN
        Application result = applicationService.saveApplication(request, file);

        // THEN:
        assertNotNull(result);
        assertEquals("Test University", result.getUniversity());
        assertEquals(100L, result.getCourseId());
        assertEquals(mockUser, result.getUser());
        assertEquals(ApplicationStatus.SUBMITTED, result.getStatus());
        assertEquals("diplomas/1/1/test.pdf", result.getDiplomaKey());

        verify(userRepository, times(1)).findById(1L);
        verify(applicationRepository, times(2)).saveAndFlush(any(Application.class));
        verify(storageService, times(1)).uploadDiploma(any(byte[].class), eq("application/pdf"), any(String.class));
    }

    @Test
    void shouldSendEmailAfterSavingApplication() {
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();
        request.setUserId(1L);

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
        applicant.setName("Jan");
        applicant.setSurname("Kowalski");
        applicant.setTelNumber("123456789");
        applicant.setPesel("44051401458");
        applicant.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        applicant.setAddress(address);

        AdmissionEducationDto education = new AdmissionEducationDto();
        education.setPreviousDegree("Inżynier");
        education.setFieldOfStudy("Informatyka");
        education.setGraduationYear(2015);

        AdmissionDetailsDto details = new AdmissionDetailsDto();
        details.setUniversity("Test University");
        details.setCourseId(100L);
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("student@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        when(storageService.uploadDiploma(any(byte[].class), eq("application/pdf"), any(String.class)))
            .thenReturn("diplomas/1/1/test.pdf");

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "diploma.pdf",
            "application/pdf",
            "%PDF-1.4 test".getBytes()
        );

        applicationService.saveApplication(request, file);

        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));


    }

    @Test
    void shouldChangeStatusToWithdrawn(){
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setStatus(ApplicationStatus.SUBMITTED);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        applicationService.updateStatus(id, ApplicationStatus.WITHDRAWN);

        assertEquals(ApplicationStatus.WITHDRAWN, application.getStatus());
    }
}
