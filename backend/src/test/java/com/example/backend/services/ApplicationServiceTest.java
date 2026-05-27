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
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
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

    private Course createMockCourse(Long id, int placesLimit) {
        Course course = new Course();
        course.setId(id);
        course.setName("Test Course");
        course.setDescription("Test course description");
        course.setPrice(1000.0);
        course.setPlacesLimit(placesLimit);
        course.setRecruitmentStart(LocalDate.of(2026, 1, 1));
        course.setRecruitmentEnd(LocalDate.of(2026, 6, 30));
        course.setAcademicYear(2026);
        course.setIsRecruitmentOpen(true);
        return course;
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

        when(courseRepository.findById(100L)).thenReturn(Optional.of(createMockCourse(100L, 30)));
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
        when(courseRepository.findById(100L)).thenReturn(Optional.of(createMockCourse(100L, 30)));
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
        when(courseRepository.findById(100L)).thenReturn(Optional.of(createMockCourse(100L, 30)));

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
        when(applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(100L))
            .thenReturn(Collections.emptyList());
        Course course = createMockCourse(100L, 1);
        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));

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
        when(applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(100L))
                .thenReturn(Collections.singletonList(application));

        Course course = createMockCourse(100L, 2);
        when(courseRepository.findById(100L)).thenReturn(Optional.of(course));
        applicationService.markDiplomaAsVerified(id);
        applicationService.payEntryFee(id);

        applicationService.acceptApplication(id);

        assertTrue(application.getIsAccepted());
        assertFalse(application.getIsWaitlisted());
    }

    @Test
    void shouldRejectManualAcceptanceForWaitlistedApplication() {
        Long id = 2L;
        Application application = new Application();
        application.setId(id);
        application.setIsAccepted(false);
        application.setIsWaitlisted(true);
        application.setIsEntryFeePaid(true);
        application.setIsDiplomaVerified(true);
        application.setCourseId(200L);

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> applicationService.acceptApplication(id)
        );

        assertEquals("Nie można ręcznie zaakceptować wniosku z listy rezerwowej.", exception.getMessage());
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
        application.setSubmissionDateTime(LocalDateTime.of(2026, 1, 2, 12, 0));

        Application accepted = new Application();
        accepted.setId(1L);
        accepted.setCourseId(200L);
        accepted.setIsAccepted(true);
        accepted.setIsWaitlisted(false);
        accepted.setSubmissionDateTime(LocalDateTime.of(2026, 1, 1, 12, 0));

        when(applicationRepository.findById(id)).thenReturn(Optional.of(application));
        when(applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(200L))
            .thenReturn(List.of(accepted, application));

        Course course = createMockCourse(200L, 1);
        when(courseRepository.findById(200L)).thenReturn(Optional.of(course));

        applicationService.acceptApplication(id);

        assertFalse(application.getIsAccepted());
        assertTrue(application.getIsWaitlisted());
    }

    @Test
    void shouldDemoteAcceptedApplicationWhenPlacesLimitShrinks() {
        Long courseId = 400L;

        Application first = new Application();
        first.setId(1L);
        first.setCourseId(courseId);
        first.setIsAccepted(true);
        first.setIsWaitlisted(false);
        first.setSubmissionDateTime(LocalDateTime.of(2026, 1, 1, 10, 0));

        Application second = new Application();
        second.setId(2L);
        second.setCourseId(courseId);
        second.setIsAccepted(true);
        second.setIsWaitlisted(false);
        second.setSubmissionDateTime(LocalDateTime.of(2026, 1, 1, 11, 0));

        when(applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(courseId))
                .thenReturn(List.of(first, second));

        Course course = createMockCourse(courseId, 1);
        when(courseRepository.findById(courseId)).thenReturn(Optional.of(course));

        applicationService.recalculateCourseStatuses(courseId);

        assertTrue(first.getIsAccepted());
        assertFalse(first.getIsWaitlisted());
        assertFalse(second.getIsAccepted());
        assertTrue(second.getIsWaitlisted());
    }

    @Test
    void shouldPromoteFirstWaitlistedCandidateAfterAcceptedWithdraws() {
        Long acceptedId = 3L;
        Application accepted = new Application();
        accepted.setId(acceptedId);
        accepted.setCourseId(300L);
        accepted.setIsWithdrawn(false);
        accepted.setIsAccepted(true);
        accepted.setSubmissionDateTime(LocalDateTime.of(2026, 1, 1, 9, 0));

        Application waitlisted = new Application();
        waitlisted.setId(4L);
        waitlisted.setCourseId(300L);
        waitlisted.setIsAccepted(false);
        waitlisted.setIsWaitlisted(true);
        waitlisted.setSubmissionDateTime(LocalDateTime.of(2026, 1, 1, 10, 0));

        when(applicationRepository.findById(acceptedId)).thenReturn(Optional.of(accepted));
        when(applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(300L))
                .thenReturn(List.of(accepted, waitlisted));

        Course course = createMockCourse(300L, 1);
        course.setCoordinator(createMockUser(10L, "koord@example.com"));
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