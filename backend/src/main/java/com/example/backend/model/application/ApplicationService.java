package com.example.backend.model.application;


import com.example.backend.auth.DTO.ApplicationRequest;
import com.example.backend.model.user.User;
import com.example.backend.model.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository, UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Application saveApplication(ApplicationRequest applicationRequest) {

        User user = userRepository.findById(applicationRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Application application = new Application();
        application.setUser(user);
        application.setUniversity(applicationRequest.getUniversity());
        application.setCourseId(applicationRequest.getCourseId());
        application.setDiplomaUrl(applicationRequest.getDiplomaUrl());
        application.setIsPaid(false);

        return applicationRepository.save(application);
    }
}
