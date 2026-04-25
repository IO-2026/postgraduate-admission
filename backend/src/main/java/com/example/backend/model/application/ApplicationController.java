package com.example.backend.model.application;

import com.example.backend.model.application.dto.AdmissionSubmitRequest;
import com.example.backend.model.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;


@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @PostMapping(path = "/submit", consumes = "multipart/form-data")
    public ResponseEntity<Void> submit(@Valid @RequestPart("payload") AdmissionSubmitRequest request,
                                       @RequestPart("file") MultipartFile file,
                                       @AuthenticationPrincipal User authenticatedUser) {
        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        applicationService.saveApplication(request, authenticatedUser.getId(), file);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{id}/diploma")
    public ResponseEntity<Map<String, String>> getDiplomaDownloadUrl(@PathVariable Long id,
                                                                      Authentication authentication) {
        String signedUrl = applicationService.getDiplomaDownloadUrl(id, authentication);
        return ResponseEntity.ok(Map.of("url", signedUrl));
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
