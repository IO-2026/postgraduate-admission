package com.example.backend.model.form;

import com.example.backend.model.form.dto.FormSendRequest;
import com.example.backend.model.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/form")
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    @PostMapping("/send")
    public ResponseEntity<Void> sendMessage(@Valid @RequestBody FormSendRequest request,
                                            @AuthenticationPrincipal User sender) {
        if (sender == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        formService.sendMessage(sender, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
