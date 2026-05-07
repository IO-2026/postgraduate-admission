package com.example.backend.model.application;

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

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

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
    public ResponseEntity<?> submit(@Valid @RequestBody ApplicationDto request, @AuthenticationPrincipal User authenticatedUser) {
        List<String> validationErrors = validateSubmission(request);
        if (!validationErrors.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", String.join("; ", validationErrors)));
        }

        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Application savedApplication = applicationService.saveApplication(request, authenticatedUser.getId());
        if (savedApplication == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    private List<String> validateSubmission(ApplicationDto request) {
        List<String> errors = new ArrayList<>();

        requirePresent(request.getApplicantDateOfBirth(), "applicantDateOfBirth", errors);
        requireNotBlank(request.getApplicantPesel(), "applicantPesel", errors);
        requireNotBlank(request.getAddressStreet(), "addressStreet", errors);
        requireNotBlank(request.getAddressPostalCode(), "addressPostalCode", errors);
        requireNotBlank(request.getAddressCity(), "addressCity", errors);
        requireNotBlank(request.getPreviousDegree(), "previousDegree", errors);
        requireNotBlank(request.getFieldOfStudy(), "fieldOfStudy", errors);
        requirePresent(request.getGraduationYear(), "graduationYear", errors);
        requirePresent(request.getCourseId(), "courseId", errors);
        requireNotBlank(request.getUniversity(), "university", errors);
        requireNotBlank(request.getDiplomaUrl(), "diplomaUrl", errors);
        requireAccepted(request.getTruthfulnessConsent(), "truthfulnessConsent", errors);
        requireAccepted(request.getGdprConsent(), "gdprConsent", errors);

        if (!isBlank(request.getDiplomaUrl()) && !isValidHttpUrl(request.getDiplomaUrl())) {
            errors.add("diplomaUrl: wymagany poprawny adres URL");
        }

        if (!isBlank(request.getApplicantPesel()) && request.getApplicantPesel().length() != 11) {
            errors.add("applicantPesel: wymagany poprawny numer PESEL");
        }

        return errors;
    }

    private void requireNotBlank(String value, String fieldName, List<String> errors) {
        if (isBlank(value)) {
            errors.add(fieldName + ": wymagane");
        }
    }

    private void requirePresent(Object value, String fieldName, List<String> errors) {
        if (value == null) {
            errors.add(fieldName + ": wymagane");
        }
    }

    private void requireAccepted(Boolean value, String fieldName, List<String> errors) {
        if (!Boolean.TRUE.equals(value)) {
            errors.add(fieldName + ": wymagane");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private boolean isValidHttpUrl(String value) {
        try {
            URI uri = URI.create(value);
            return ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme())) && uri.getHost() != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
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
