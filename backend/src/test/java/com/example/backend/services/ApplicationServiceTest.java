package com.example.backend.services;


import com.example.backend.model.application.ApplicationMapper;
import com.example.backend.model.application.dto.AdmissionAddressDto;
import com.example.backend.model.application.dto.AdmissionApplicantDto;
import com.example.backend.model.application.dto.AdmissionDetailsDto;
import com.example.backend.model.application.dto.AdmissionEducationDto;
import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.application.ApplicationStatus;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Spy
    private ApplicationMapper applicationMapper;

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void shouldSuccessfullySaveApplication() {
        // GIVEN: Przygotowujemy dane wejściowe
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
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
        details.setDiplomaUrl("https://example.com/diploma.pdf");
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setName("Jan");
        mockUser.setSurname("Kowalski");
        mockUser.setEmail("jan@example.com");
        mockUser.setTelNumber("123456789");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        // WHEN
        Application result = applicationService.saveApplication(request, 1L);

        // THEN:
        assertNotNull(result);
        assertEquals("Test University", result.getUniversity());
        assertEquals(100L, result.getCourseId());
        assertEquals(mockUser, result.getUser());
        assertEquals(ApplicationStatus.SUBMITTED, result.getStatus());

        verify(userRepository, times(1)).findById(1L);
        verify(applicationRepository, times(1)).saveAndFlush(any(Application.class));
    }

    @Test
    void shouldSendEmailAfterSavingApplication() {
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
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
        details.setDiplomaUrl("https://example.com/diploma.pdf");
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setName("Jan");
        mockUser.setSurname("Kowalski");
        mockUser.setEmail("jan@example.com");
        mockUser.setTelNumber("123456789");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        applicationService.saveApplication(request, 1L);

        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));


    }

    @Test
    void shouldFailAndInvalidateSubmissionWhenEmailSendingFails() {
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
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
        details.setDiplomaUrl("https://example.com/diploma.pdf");
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User mockUser = new User();
        mockUser.setId(1L);
        mockUser.setName("Jan");
        mockUser.setSurname("Kowalski");
        mockUser.setEmail("jan@example.com");
        mockUser.setTelNumber("123456789");

        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        org.mockito.Mockito.doThrow(new MailSendException("smtp unavailable"))
                .when(emailService)
                .sendApplicationStatusChange(eq(mockUser), any(Application.class));

        assertThrows(MailSendException.class, () -> applicationService.saveApplication(request, 1L));

        verify(applicationRepository, times(1)).saveAndFlush(any(Application.class));
        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));
    }

    @Test
    void shouldFailWhenUserProfileIsIncomplete() {
        AdmissionSubmitRequest request = new AdmissionSubmitRequest();

        AdmissionAddressDto address = new AdmissionAddressDto();
        address.setStreet("Testowa 1");
        address.setPostalCode("30-059");
        address.setCity("Kraków");

        AdmissionApplicantDto applicant = new AdmissionApplicantDto();
        applicant.setPesel("44051401458");
        applicant.setDateOfBirth(java.time.LocalDate.of(1990, 1, 1));
        applicant.setAddress(address);

        AdmissionEducationDto education = new AdmissionEducationDto();
        AdmissionDetailsDto details = new AdmissionDetailsDto();
        details.setUniversity("Test University");
        details.setCourseId(100L);
        details.setDiplomaUrl("https://example.com/diploma.pdf");
        details.setTruthfulnessConsent(true);
        details.setGdprConsent(true);

        request.setApplicant(applicant);
        request.setEducation(education);
        request.setDetails(details);

        User incompleteUser = new User();
        incompleteUser.setId(1L);
        incompleteUser.setName("Jan");
        incompleteUser.setSurname("Kowalski");
        incompleteUser.setEmail("jan@example.com");
        incompleteUser.setTelNumber(" ");

        when(userRepository.findById(1L)).thenReturn(Optional.of(incompleteUser));

        assertThrows(IllegalArgumentException.class, () -> applicationService.saveApplication(request, 1L));
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
