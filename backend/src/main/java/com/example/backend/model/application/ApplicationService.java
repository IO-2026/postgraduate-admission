package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.course.Course;
import com.example.backend.model.course.CourseRepository;
import com.example.backend.model.message.MessageService;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import com.example.backend.storage.SupabaseStorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final MessageService messageService;
    private final EmailService emailService;
    private final ApplicationMapper applicationMapper;
    private final SupabaseStorageService storageService;

    @Transactional
    public Application saveApplication(ApplicationDto admissionRequest, MultipartFile diplomaFile, User user) {
        if (user == null) {
            throw new IllegalArgumentException("Zalogowany użytkownik nie znaleziony");
        }

        long courseId = admissionRequest.getCourseId();
        long userId = user.getId();

        List<ApplicationDto> applicationsOfUser = getApplicationsOfUser(userId);
        if (applicationsOfUser.stream().anyMatch(application -> application.getCourseId() == courseId)) {
            return null;
        }

        Application application = applicationMapper.toEntity(admissionRequest);
        application.setUser(user);
        application.setApplicationStatus(ApplicationStatus.SUBMITTED);
        application.setIsAccepted(false);
        application.setIsWithdrawn(false);

        Application savedApplication = applicationRepository.saveAndFlush(application);

        String objectKey = buildDiplomaObjectKey(savedApplication.getId());
        storageService.uploadDiploma(objectKey, diplomaFile.getResource());

        savedApplication.setDiplomaBucketKey(objectKey);

        registerRollbackCleanup(storageService.getDiplomasBucket(), objectKey);

        emailService.sendApplicationStatusChange(user, savedApplication);

        return savedApplication;
    }

    public String getSignedDiplomaUrl(Long applicationId, User requester) {
        if (requester == null) {
            throw new IllegalArgumentException("Zalogowany użytkownik nie znaleziony");
        }
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if (isCandidate(requester) && !application.getUser().getId().equals(requester.getId())) {
            throw new SecurityException("Odmowa dostępu");
        }

        String objectKey = application.getDiplomaBucketKey();
        if (objectKey == null || objectKey.isBlank()) {
            throw new EntityNotFoundException("Dyplom nie znaleziony");
        }

        return storageService.createSignedUrl(storageService.getDiplomasBucket(), objectKey);
    }


    @Transactional
    public void withdrawApplication(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if (application.getIsWithdrawn()) {
            throw new IllegalStateException("Wniosek jest już wycofany.");
        }
        ApplicationStatus previousStatus = application.getApplicationStatus();
        application.setIsWithdrawn(true);
        application.setIsAccepted(false);
        application.setApplicationStatus(ApplicationStatus.WITHDRAWN);

        if (previousStatus == ApplicationStatus.ACCEPTED) {
            promoteFirstWaitlistedCandidate(application.getCourseId());
        }
    }

    @Transactional
    public void markDiplomaAsVerified(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if(application.getIsWithdrawn()) {
            throw new IllegalStateException("Wniosek jest wycofany - dalsze akcje niemożliwe");
        }
        application.setIsDiplomaVerified(true);
    }

    @Transactional
    public void markDeclarationAsVerified(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if(application.getIsWithdrawn()) {
            throw new IllegalStateException("Wniosek jest wycofany - dalsze akcje niemożliwe");
        }
        application.setIsDeclarationVerified(true);
    }

    @Transactional
    public void payEntryFee(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if (application.getIsWithdrawn()) {
            throw new IllegalStateException("Wniosek jest wycofany - dalsze akcje niemożliwe");
        }
        application.setIsEntryFeePaid(true);
    }

    @Transactional
    public void paySemester(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if (application.getIsWithdrawn()) {
            throw new IllegalStateException("Wniosek jest wycofany - dalsze akcje niemożliwe");
        } else if (!application.getIsAccepted()) {
            throw new IllegalStateException("Nie można opłacić pierwszego semestru dopóki wniosek nie zostanie zaakceptowany");
        }
        application.setIsSemesterPaid(true);
    }

    @Transactional
    public void acceptApplication(Long applicationId) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));

        if (application.getIsWithdrawn()) {
            throw new IllegalStateException("Nie można zaakceptować wycofanego wniosku.");
        }

        if(!application.getIsDiplomaVerified() || !application.getIsEntryFeePaid()){
            throw new IllegalStateException("Nie można zaakceptować: brakuje opłaty lub dyplomu.");
        }

        if (application.getApplicationStatus() == ApplicationStatus.ACCEPTED) {
            throw new IllegalStateException("Wniosek został już zaakceptowany.");
        }

        Course course = courseRepository.findById(application.getCourseId())
                .orElseThrow(() -> new RuntimeException("Kurs nie znaleziony"));

        long acceptedCount = applicationRepository.countByCourseIdAndApplicationStatus(
                application.getCourseId(),
                ApplicationStatus.ACCEPTED
        );

        ApplicationStatus newStatus = acceptedCount < course.getPlacesLimit()
                ? ApplicationStatus.ACCEPTED
                : ApplicationStatus.WAITING_LIST;

        application.setApplicationStatus(newStatus);
        application.setIsAccepted(newStatus == ApplicationStatus.ACCEPTED);

        notifyStatusChange(application, newStatus, course);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public List<Application> getApplicationsForCourse(Long courseId) {
        return applicationRepository.findByCourseIdOrderBySubmissionDateTimeAscIdAsc(courseId);
    }

    public void updateApplication(ApplicationDto dto) {
        long id = dto.getId();

        Application existingApplication = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Wniosek nie znaleziony"));
        applicationMapper.updateEntityFromDTO(dto, existingApplication);
        applicationMapper.toDto(applicationRepository.save(existingApplication));
    }

    public ApplicationDto getApplication(long id) {
        Application application = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Wniosek nie znaleziony"));
        return applicationMapper.toDto(application);
    }

    public List<ApplicationDto> getApplicationsOfUser(long userId) {
        return applicationRepository.findByUserId(userId).stream()
                .map(applicationMapper::toDto)
                .toList();
    }


    private void registerRollbackCleanup(String bucket, String objectKey) {
        // Only register synchronization when a transaction is active.
        // In unit tests (Mockito-only) there may be no active transaction,
        // calling registerSynchronization then throws IllegalStateException.
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    if (status == STATUS_ROLLED_BACK) {
                        storageService.deleteObject(bucket, objectKey);
                    }
                }
            });
        }
    }

    private String buildDiplomaObjectKey(Long applicationId) {
        return "applications/" + applicationId + "/diploma.pdf";
    }

    private boolean isCandidate(User user) {
        String roleName = user.getRole() != null ? user.getRole().getName() : "";
        return "Candidate".equalsIgnoreCase(roleName) || "ROLE_Candidate".equalsIgnoreCase(roleName);
    }

    private void promoteFirstWaitlistedCandidate(Long courseId) {
        Optional<Application> nextCandidate = applicationRepository
                .findFirstByCourseIdAndApplicationStatusOrderBySubmissionDateTimeAscIdAsc(
                        courseId,
                        ApplicationStatus.WAITING_LIST
                );

        if (nextCandidate.isEmpty()) {
            return;
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Kurs nie znaleziony"));

        Application application = nextCandidate.get();
        application.setApplicationStatus(ApplicationStatus.ACCEPTED);
        application.setIsAccepted(true);

        notifyStatusChange(application, ApplicationStatus.ACCEPTED, course);
    }

    private void notifyStatusChange(Application application, ApplicationStatus newStatus, Course course) {
        if (application.getUser() == null) {
            return;
        }

        String statusDescription = newStatus.getDescription();
        String courseName = course != null ? course.getName() : "Nieznany kierunek";
        String subject = "Zmiana statusu rekrutacji";
        String content = String.format(
                "Twoje zgłoszenie na kierunek %s zostało zaktualizowane. Aktualny status: %s.",
                courseName,
                statusDescription
        );

        User sender = resolveNotificationSender(course);
        if (sender != null) {
            messageService.sendSystemMessage(sender, application.getUser(), subject, content);
        } else {
            emailService.sendApplicationStatusChange(application.getUser(), application);
        }
    }

    private User resolveNotificationSender(Course course) {
        if (course != null && course.getCoordinator() != null) {
            return course.getCoordinator();
        }

        return userRepository.findFirstByRoleName("Admin").orElse(null);
    }
}
