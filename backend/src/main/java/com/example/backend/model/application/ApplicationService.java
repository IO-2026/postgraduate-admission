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

        Application savedApplication = applicationRepository.save(application);

        emailService.sendApplicationConfirmation(user, application);

        return savedApplication;
    }
}
