package com.example.backend.model.application;

import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.user.User;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @PostMapping("/submit")
    public ResponseEntity<Void> submit(
            @Valid @RequestBody AdmissionSubmitRequest request,
            @AuthenticationPrincipal User authenticatedUser
    ) {
        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        applicationService.saveApplication(request, authenticatedUser.getId());
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

    @PatchMapping("/")
    public ResponseEntity<?> updateApplication(@RequestBody ApplicationDto applicationDto) {
        applicationService.updateApplication(applicationDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ApplicationDto getApplication(@PathVariable Long id) {
        return applicationService.getApplication(id);
    }
}
