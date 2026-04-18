package com.example.backend.model.application;


import com.example.backend.auth.DTO.ApplicationRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {
    private static final Logger logger = LoggerFactory.getLogger(ApplicationController.class);

    private final ApplicationService applicationService;

    @PostMapping("/submit")
    public ResponseEntity<?> submit(@RequestBody ApplicationRequest request) {
        try {
            applicationService.saveApplication(request);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception exception) {
            Throwable root = rootCause(exception);
            String message = root.getMessage();
            logger.error(
                    "Application submit failed (userId={}, courseId={}): {}: {}",
                    request.getUserId(),
                    request.getCourseId(),
                    root.getClass().getName(),
                    message
            );

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Application submission failed: " + (message == null ? root.getClass().getSimpleName() : message));
        }
    }

    private static Throwable rootCause(Throwable throwable) {
        Throwable current = throwable;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
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
