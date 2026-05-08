package com.example.backend.model.application;

import com.example.backend.model.application.dto.ApplicationDto;
import com.example.backend.model.declaration.DeclarationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
    private final DeclarationService declarationService;

    @GetMapping("/of/{userId}")
    public List<ApplicationDto> getApplicationsOfUser(@PathVariable long userId) {
        return applicationService.getApplicationsOfUser(userId);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody ApplicationDto request) {
        Application savedApplication = applicationService.saveApplication(request);
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

    @PatchMapping("/")
    public ResponseEntity<?> updateApplication(@RequestBody ApplicationDto applicationDto) {
        applicationService.updateApplication(applicationDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}")
    public ApplicationDto getApplication(@PathVariable Long id) {
        return applicationService.getApplication(id);
    }

    @GetMapping("/{id}/declaration")
    public ResponseEntity<byte[]> getDeclaration(@PathVariable Long id) {
        byte[] pdf = declarationService.generateDeclarationPdf(id);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("oswiadczenie_" + id + ".pdf")
                .build());
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}