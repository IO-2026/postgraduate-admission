package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.validation.PdfFile;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.model.user.User;
import jakarta.persistence.EntityNotFoundException;

import java.util.Map;
import java.util.List;

@Validated
@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @GetMapping("/of/{userId}")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator') or (hasRole('Candidate') and #userId == authentication.principal.id)")
    public List<ApplicationDto> getApplicationsOfUser(@PathVariable long userId) {
        return applicationService.getApplicationsOfUser(userId);
    }

    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('Candidate')")
    public ResponseEntity<?> submit(@Valid @RequestPart("application") ApplicationDto request,
                                    @PdfFile @RequestPart("diploma") MultipartFile diplomaFile,
                                    @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            Application savedApplication = applicationService.saveApplication(request, diplomaFile, user);
            if (savedApplication == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of("id", savedApplication.getId()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
        }
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('Candidate') and @securityService.isApplicationOwner(authentication, #id)")
    public ResponseEntity<Void> withdrawApplication(@PathVariable Long id) {
        applicationService.withdrawApplication(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/verify-diploma")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> verifyDiploma(@PathVariable Long id) {
        applicationService.markDiplomaAsVerified(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/verify-declaration")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> verifyDeclaration(@PathVariable Long id) {
        applicationService.markDeclarationAsVerified(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/pay-entry-fee")
    @PreAuthorize("hasRole('Candidate') and @securityService.isApplicationOwner(authentication, #id)")
    public ResponseEntity<?> payEntryFee(@PathVariable Long id) {
        applicationService.payEntryFee(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/pay-semester")
    @PreAuthorize("hasRole('Candidate') and @securityService.isApplicationOwner(authentication, #id)")
    public ResponseEntity<?> paySemester(@PathVariable Long id) {
        applicationService.paySemester(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/accept")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> acceptApplication(@PathVariable Long id) {
        applicationService.acceptApplication(id);
        return ResponseEntity.ok().build();
    }


    @PatchMapping("/")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator')")
    public ResponseEntity<?> updateApplication(@RequestBody ApplicationDto applicationDto) {
        applicationService.updateApplication(applicationDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('Admin', 'Coordinator') or (hasRole('Candidate') and #id == authentication.principal.id)")
    public ApplicationDto getApplication(@PathVariable Long id) {
        return applicationService.getApplication(id);
    }

    @GetMapping("/{id}/diploma-url")
    @PreAuthorize("hasAnyRole('Candidate', 'Coordinator', 'Admin')")
    public ResponseEntity<?> getDiplomaUrl(@PathVariable Long id,
                                           @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            String signedUrl = applicationService.getSignedDiplomaUrl(id, user);
            return ResponseEntity.ok(Map.of("url", signedUrl));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}