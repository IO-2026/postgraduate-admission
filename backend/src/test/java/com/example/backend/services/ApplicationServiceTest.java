package com.example.backend.services;


import com.example.backend.auth.DTO.ApplicationRequest;
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
import org.mockito.junit.jupiter.MockitoExtension;

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

    @InjectMocks
    private ApplicationService applicationService;

    @Test
    void shouldSuccessfullySaveApplication() {
        // GIVEN: Przygotowujemy dane wejściowe
        ApplicationRequest request = new ApplicationRequest();
        request.setUserId(1L);
        request.setUniversity("Test University");
        request.setCourseId(100L);

        User mockUser = new User();
        mockUser.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        // WHEN
        Application result = applicationService.saveApplication(request);

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
        ApplicationRequest request = new ApplicationRequest();
        request.setUserId(1L);
        request.setUniversity("Test University");
        request.setCourseId(100L);

        User mockUser = new User();
        mockUser.setId(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);

        applicationService.saveApplication(request);

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
