package com.example.backend.security;

import com.example.backend.model.application.Application;
import com.example.backend.model.application.ApplicationRepository;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("securityService")
@RequiredArgsConstructor
public class SecurityService {

    private final ApplicationRepository applicationRepository;

    public boolean isApplicationOwner(Authentication authentication, Long applicationId) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User)) {
            return false;
        }

        User user = (User) principal;
        Application application = applicationRepository.findById(applicationId).orElse(null);

        return application != null && application.getUser().getId().equals(user.getId());
    }
}
