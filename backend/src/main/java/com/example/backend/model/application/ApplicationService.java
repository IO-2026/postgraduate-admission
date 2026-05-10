package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.storage.SupabaseStorageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final EmailService emailService;
    private final ApplicationMapper applicationMapper;
    private final ApplicationDiplomaRepository applicationDiplomaRepository;
    private final SupabaseStorageService storageService;

    @Transactional
    public Application saveApplication(ApplicationDto admissionRequest, MultipartFile diplomaFile, User user) {
        if (user == null) {
            throw new IllegalArgumentException("Authenticated user not found");
        }
        validateProfileCompleteness(user);
        validateDiplomaFile(diplomaFile);

        long courseId = admissionRequest.getCourseId();
        long userId = user.getId();

        List<ApplicationDto> applicationsOfUser = getApplicationsOfUser(userId);
        if (applicationsOfUser.stream().anyMatch(application -> application.getCourseId() == courseId)) {
            return null;
        }

        Application application = applicationMapper.toEntity(admissionRequest);
        application.setUser(user);
        application.setIsPaid(false);
        application.setStatus(ApplicationStatus.SUBMITTED);

        Application savedApplication = applicationRepository.saveAndFlush(application);

        String objectKey = buildDiplomaObjectKey(savedApplication.getId());
        storageService.uploadDiploma(objectKey, diplomaFile.getResource());

        ApplicationDiploma diploma = new ApplicationDiploma();
        diploma.setApplication(savedApplication);
        diploma.setObjectKey(objectKey);
        diploma.setBucket(storageService.getDiplomasBucket());
        diploma.setOriginalName(diplomaFile.getOriginalFilename());
        diploma.setMimeType(diplomaFile.getContentType());
        diploma.setSizeBytes(diplomaFile.getSize());
        applicationDiplomaRepository.save(diploma);
        savedApplication.setDiploma(diploma);

        registerRollbackCleanup(diploma.getBucket(), objectKey);

        emailService.sendApplicationStatusChange(user, savedApplication);

        return savedApplication;
    }

    public String getSignedDiplomaUrl(Long applicationId, User requester) {
        if (requester == null) {
            throw new IllegalArgumentException("Authenticated user not found");
        }
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (isCandidate(requester) && !application.getUser().getId().equals(requester.getId())) {
            throw new SecurityException("Access denied");
        }

        ApplicationDiploma diploma = application.getDiploma();
        if (diploma == null) {
            throw new EntityNotFoundException("Diploma not found");
        }

        return storageService.createSignedUrl(diploma.getBucket(), diploma.getObjectKey());
    }

    private void validateProfileCompleteness(User user) {
        if (isBlank(user.getName()) || isBlank(user.getSurname()) || isBlank(user.getEmail()) || isBlank(user.getTelNumber())) {
            throw new IllegalArgumentException("Profil użytkownika jest niekompletny. Uzupełnij imię, nazwisko, e-mail i numer telefonu.");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    @Transactional
    public void updateStatus(Long applicationId, ApplicationStatus newStatus) {
        Application application = applicationRepository.findById(applicationId).orElseThrow(() -> new RuntimeException("Application not found"));
        User user = application.getUser();

        if (application.getStatus() == ApplicationStatus.WITHDRAWN) {
            throw new IllegalStateException("Wniosek jest już wycofany.");
        }

        application.setStatus(newStatus);
        emailService.sendApplicationStatusChange(user, application);
    }

    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
    }

    public void updateApplication(ApplicationDto dto) {
        long id = dto.getId();

        Application existingApplication = applicationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found"));
        applicationMapper.updateEntityFromDTO(dto, existingApplication);
        applicationMapper.toDto(applicationRepository.save(existingApplication));
    }

    public ApplicationDto getApplication(long id) {
        Application application = applicationRepository.findById(id).orElseThrow(() -> new RuntimeException("Application not found"));
        return applicationMapper.toDto(application);
    }

    public List<ApplicationDto> getApplicationsOfUser(long userId) {
        return applicationRepository.findByUserId(userId).stream()
                .map(applicationMapper::toDto)
                .toList();
    }

    private void validateDiplomaFile(MultipartFile diplomaFile) {
        if (diplomaFile == null || diplomaFile.isEmpty()) {
            throw new IllegalArgumentException("Plik dyplomu jest wymagany.");
        }
        if (!"application/pdf".equalsIgnoreCase(diplomaFile.getContentType())) {
            throw new IllegalArgumentException("Dozwolony jest wyłącznie plik PDF.");
        }
        if (diplomaFile.getSize() > storageService.getMaxDiplomaBytes()) {
            throw new IllegalArgumentException("Plik PDF przekracza dopuszczalny rozmiar.");
        }
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
}
