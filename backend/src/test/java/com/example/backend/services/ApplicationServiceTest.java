package com.example.backend.services;

import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationMapper;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.application.ApplicationService;
import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.message.MessageService;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.storage.SupabaseStorageService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class ApplicationServiceTest {
    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageService messageService;

    @Mock
    private EmailService emailService;

    @Mock
    private ApplicationMapper applicationMapper;

    @Mock
    private SupabaseStorageService storageService;

    @InjectMocks
    private ApplicationService applicationService;

    private ApplicationDto createDefaultApplicationDto() {
        return ApplicationDto.builder()
                .university("Test University")
                .courseId(100L)
                .candidatePesel("44051401458")
                .candidateDateOfBirth(LocalDate.of(1990, 1, 1))
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

    // --- TESTY TWORZENIA APLIKACJI ---

    @Test
    void shouldSuccessfullySaveApplication() {
        // GIVEN
        ApplicationDto request = createDefaultApplicationDto();

        User mockUser = createMockUser(1L, "jan@example.com");
        when(applicationRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        Application mockApplication = new Application();
        mockApplication.setUniversity("Test University");
        mockApplication.setCourseId(100L);
        // Symulacja tego, co robi serwis podczas tworzenia nowej aplikacji
        mockApplication.setIsWithdrawn(false);
        mockApplication.setIsAccepted(false);
        mockApplication.setIsEntryFeePaid(false);
        mockApplication.setIsSemesterPaid(false);
        mockApplication.setIsDiplomaVerified(false);
        mockApplication.setIsDeclarationVerified(false);

        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        when(storageService.getDiplomasBucket()).thenReturn("diplomas");
        when(storageService.getMaxDiplomaBytes()).thenReturn(10 * 1024 * 1024L);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "fake-pdf".getBytes()
        );

        // WHEN
        Application result = applicationService.saveApplication(request, diplomaFile, mockUser);

        // THEN
        assertNotNull(result);
        assertEquals("Test University", result.getUniversity());
        assertEquals(100L, result.getCourseId());
        assertEquals(mockUser, result.getUser());

        // Zamiast enuma statusu, sprawdzamy domyślne flagi
        assertFalse(result.getIsWithdrawn());
        assertFalse(result.getIsAccepted());
        assertFalse(result.getIsWaitlisted());
        assertFalse(result.getIsEntryFeePaid());
        assertFalse(result.getIsSemesterPaid());
        assertFalse(result.getIsDiplomaVerified());
        assertFalse(result.getIsDeclarationVerified());

        verify(applicationRepository, times(1)).saveAndFlush(any(Application.class));
    }

    @Test
    void shouldSendEmailAfterSavingApplication() {
        ApplicationDto request = createDefaultApplicationDto();

        User mockUser = createMockUser(3L, "jan3@example.com");
        when(applicationRepository.findByUserId(3L)).thenReturn(Collections.emptyList());
        Application mockApplication = new Application();
        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        when(storageService.getDiplomasBucket()).thenReturn("diplomas");
        when(storageService.getMaxDiplomaBytes()).thenReturn(10 * 1024 * 1024L);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "fake-pdf".getBytes()
        );

        applicationService.saveApplication(request, diplomaFile, mockUser);

        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));
    }

    @Test
    void shouldFailAndInvalidateSubmissionWhenEmailSendingFails() {
        ApplicationDto request = createDefaultApplicationDto();

        User mockUser = createMockUser(2L, "jan2@example.com");
        when(applicationRepository.findByUserId(2L)).thenReturn(Collections.emptyList());

        Application mockApplication = new Application();
        when(applicationMapper.toEntity(request)).thenReturn(mockApplication);
        when(applicationRepository.saveAndFlush(any(Application.class))).thenAnswer(i -> i.getArguments()[0]);
        when(storageService.getDiplomasBucket()).thenReturn("diplomas");
        when(storageService.getMaxDiplomaBytes()).thenReturn(10 * 1024 * 1024L);

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "fake-pdf".getBytes()
        );

        Mockito.doThrow(new MailSendException("smtp unavailable"))
                .when(emailService)
                .sendApplicationStatusChange(eq(mockUser), any(Application.class));

        assertThrows(MailSendException.class, () -> applicationService.saveApplication(request, diplomaFile, mockUser));

        verify(applicationRepository, times(1)).saveAndFlush(any(Application.class));
        verify(emailService, times(1)).sendApplicationStatusChange(eq(mockUser), any(Application.class));
    }

    @Test
    void shouldFailWhenUserIsNull() {
        ApplicationDto request = createDefaultApplicationDto();

        MockMultipartFile diplomaFile = new MockMultipartFile(
                "diploma",
                "diploma.pdf",
                "application/pdf",
                "fake-pdf".getBytes()
        );

        assertThrows(IllegalArgumentException.class, () -> applicationService.saveApplication(request, diplomaFile, null));
    }

    // --- NOWE TESTY FLAG ---

    @Test
    void shouldWithdrawApplicationSuccessfully() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setIsWithdrawn(false);
        application.setCourseId(100L);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        applicationService.withdrawApplication(id);

        assertTrue(application.getIsWithdrawn());
        assertFalse(application.getIsAccepted());
        assertFalse(application.getIsWaitlisted());
    }

    @Test
    void shouldThrowExceptionWhenWithdrawingAlreadyWithdrawnApplication() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setIsWithdrawn(true);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        assertThrows(IllegalStateException.class, () -> applicationService.withdrawApplication(id));
    }

    @Test
    void shouldPayEntryFeeSuccessfully() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setIsWithdrawn(false);
        application.setIsEntryFeePaid(false);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        applicationService.payEntryFee(id);

        assertTrue(application.getIsEntryFeePaid());
    }

    @Test
    void shouldAcceptApplicationSuccessfullyAfterDiplomaAndEntryFee() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setIsAccepted(false);
        application.setIsEntryFeePaid(true);
        application.setIsDiplomaVerified(true);
        application.setCourseId(100L);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));
        when(applicationRepository.countByCourseIdAndIsAcceptedTrueAndIsWithdrawnFalse(100L))
            .thenReturn(0L);

        Course course = new Course();
        course.setId(100L);
        course.setPlacesLimit(2);
        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));
        applicationService.markDiplomaAsVerified(id);
        applicationService.payEntryFee(id);

        applicationService.acceptApplication(id);

        assertTrue(application.getIsAccepted());
        assertFalse(application.getIsWaitlisted());
    }

    @Test
    void shouldMoveApplicationToWaitlistWhenNoPlacesLeft() {
        Long id = 2L;
        Application application = new Application();
        application.setId(id);
        application.setIsAccepted(false);
        application.setIsEntryFeePaid(true);
        application.setIsDiplomaVerified(true);
        application.setCourseId(200L);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));
        when(applicationRepository.countByCourseIdAndIsAcceptedTrueAndIsWithdrawnFalse(200L))
                .thenReturn(1L);

        Course course = new Course();
        course.setId(200L);
        course.setPlacesLimit(1);
        when(courseRepository.findById(200L)).thenReturn(Optional.of(course));

        applicationService.acceptApplication(id);

        assertFalse(application.getIsAccepted());
        assertTrue(application.getIsWaitlisted());
    }

    @Test
    void shouldPromoteFirstWaitlistedCandidateAfterAcceptedWithdraws() {
        Long acceptedId = 3L;
        Application accepted = new Application();
        accepted.setId(acceptedId);
        accepted.setCourseId(300L);
        accepted.setIsWithdrawn(false);
        accepted.setIsAccepted(true);

        Application waitlisted = new Application();
        waitlisted.setId(4L);
        waitlisted.setCourseId(300L);
        waitlisted.setIsAccepted(false);
        waitlisted.setIsWaitlisted(true);

        when(applicationRepository.findById(acceptedId)).thenReturn(Optional.of(accepted));
        when(applicationRepository.findFirstByCourseIdAndIsWaitlistedTrueAndIsWithdrawnFalseOrderBySubmissionDateTimeAscIdAsc(
            300L
        )).thenReturn(Optional.of(waitlisted));

        Course course = new Course();
        course.setId(300L);
        course.setPlacesLimit(1);
        User coordinator = createMockUser(10L, "koord@example.com");
        course.setCoordinator(coordinator);
        when(courseRepository.findById(300L)).thenReturn(Optional.of(course));

        applicationService.withdrawApplication(acceptedId);

        assertTrue(accepted.getIsWithdrawn());
        assertTrue(waitlisted.getIsAccepted());
        assertFalse(waitlisted.getIsWaitlisted());
    }

    @Test
    void shouldVerifyDiplomaSuccessfully() {
        Long id = 1L;
        Application application = new Application();
        application.setId(id);
        application.setIsDiplomaVerified(false);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        // Założyłem, że nazwa metody w serwisie to verifyDiploma
        applicationService.markDiplomaAsVerified(id);

        assertTrue(application.getIsDiplomaVerified());
    }
}