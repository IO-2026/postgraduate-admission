package com.example.backend.model.application;


import com.example.backend.auth.DTO.ApplicationRequest;
import com.example.backend.model.notification.EmailService;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Transactional
    public Application saveApplication(ApplicationRequest applicationRequest) {

        User user = userRepository.findById(applicationRequest.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));

        Application application = new Application();
        application.setUser(user);
        application.setUniversity(applicationRequest.getUniversity());
        application.setCourseId(applicationRequest.getCourseId());
        application.setDiplomaUrl(applicationRequest.getDiplomaUrl());
        application.setIsPaid(false);
        application.setStatus(ApplicationStatus.SUBMITTED);

        // Flush early so DB errors happen before we attempt to send email.
        // This also ensures we don't send confirmation for a record that can't be persisted.
        Application savedApplication = applicationRepository.saveAndFlush(application);

        emailService.sendApplicationStatusChange(user, savedApplication);

        return savedApplication;
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
}
