package com.example.backend.model.application;



import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final ApplicationMapper applicationMapper;

    @Transactional
    public Application saveApplication(AdmissionSubmitRequest admissionRequest, Long authenticatedUserId) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        validateProfileCompleteness(user);

        Application application = applicationMapper.toEntity(admissionRequest);
        application.setUser(user);
        application.setIsPaid(false);
        application.setStatus(ApplicationStatus.SUBMITTED);

        Application savedApplication = applicationRepository.saveAndFlush(application);

        emailService.sendApplicationStatusChange(user, savedApplication);

        return savedApplication;
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
}
