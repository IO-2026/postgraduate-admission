package com.example.backend.model.application;

import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @GetMapping("/of/{userId}")
    public List<ApplicationDto> getApplicationsOfUser(@PathVariable long userId) {
        return applicationService.getApplicationsOfUser(userId);
    }

    @PostMapping("/submit")
    public ResponseEntity<Void> submit(@Valid @RequestBody AdmissionSubmitRequest request, @AuthenticationPrincipal User authenticatedUser) {
        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Application savedApplication = applicationService.saveApplication(request, authenticatedUser.getId());
        if (savedApplication == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PatchMapping("/{id}/withdraw")
    public ResponseEntity<?> withdraw(@PathVariable Long id) {
        applicationService.updateStatus(id, ApplicationStatus.WITHDRAWN);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody ApplicationStatus newStatus) {
        applicationService.updateStatus(id, newStatus);
        return ResponseEntity.ok().build();
    }
}
