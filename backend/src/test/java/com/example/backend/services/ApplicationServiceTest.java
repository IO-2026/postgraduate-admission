package com.example.backend.services;

import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationMapper;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.application.ApplicationStatus;
import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;

import java.time.LocalDate;
import java.util.Collections;
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

    @Mock
    private ApplicationMapper applicationMapper;

    @InjectMocks
    private ApplicationService applicationService;

    private ApplicationDto createDefaultApplicationDto() {
        return ApplicationDto.builder()
                .university("Test University")
                .courseId(100L)
                .diplomaUrl("https://example.com/diploma.pdf")
                .applicantPesel("44051401458")
                .applicantDateOfBirth(LocalDate.of(1990, 1, 1))
                .addressStreet("Testowa 1")
                .addressPostalCode("30-059")
                .addressCity("Kraków")
                .previousDegree("Inżynier")
                .fieldOfStudy("Informatyka")
                .graduationYear(2015)
                .truthfulnessConsent(true)
                .gdprConsent(true)
                .build();
    }

    private User createMockUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setName("Jan");
        user.setSurname("Kowalski");
        user.setEmail(email);
        user.setTelNumber("123456789");
        return user;
    }

    @Test
    void shouldSuccessfullySaveApplication() {
        // GIVEN
        ApplicationDto request = createDefaultApplicationDto();
        request.setUserId(1L);

        User mockUser = createMockUser(1L, "jan@example.com");
        when(applicationRepository.findAll()).thenReturn(Collections.emptyList());
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        Application mockApplication = new Application();
        mockApplication.setUniversity("Test University");
        mockApplication.setCourseId(100L);
        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        // WHEN
        Application result = applicationService.saveApplication(request);

        // THEN
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
        ApplicationDto request = createDefaultApplicationDto();
        request.setUserId(3L);

        User mockUser = createMockUser(3L, "jan3@example.com");
        when(userRepository.findById(3L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.findAll()).thenReturn(Collections.emptyList());
        Application mockApplication = new Application();
        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        applicationService.saveApplication(request);

        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));
    }

    @Test
    void shouldFailAndInvalidateSubmissionWhenEmailSendingFails() {
        ApplicationDto request = createDefaultApplicationDto();
        request.setUserId(2L);

        User mockUser = createMockUser(2L, "jan2@example.com");

        when(userRepository.findById(2L)).thenReturn(Optional.of(mockUser));
        Application mockApplication = new Application();
        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        Mockito.doThrow(new MailSendException("smtp unavailable"))
                .when(emailService)
                .sendApplicationStatusChange(eq(mockUser), any(Application.class));

        assertThrows(MailSendException.class, () -> applicationService.saveApplication(request));

        verify(applicationRepository, times(1)).saveAndFlush(any(Application.class));
        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));
    }

    @Test
    void shouldFailWhenUserProfileIsIncomplete() {
        ApplicationDto request = createDefaultApplicationDto();
        request.setUserId(1L);

        User incompleteUser = new User();
        incompleteUser.setId(1L);
        incompleteUser.setName("Jan");
        incompleteUser.setSurname("Kowalski");
        incompleteUser.setEmail("jan@example.com");
        incompleteUser.setTelNumber(" ");

        when(userRepository.findById(1L)).thenReturn(Optional.of(incompleteUser));

        assertThrows(IllegalArgumentException.class, () -> applicationService.saveApplication(request));
    }

    @Test
    void shouldChangeStatusToWithdrawn() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setStatus(ApplicationStatus.SUBMITTED);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        applicationService.updateStatus(id, ApplicationStatus.WITHDRAWN);

        assertEquals(ApplicationStatus.WITHDRAWN, application.getStatus());
    }
}
