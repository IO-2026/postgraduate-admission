package com.example.backend.model.application;


import com.example.backend.auth.DTO.ApplicationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private final ApplicationService applicationService;

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody ApplicationRequest request) {
        applicationService.saveApplication(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
