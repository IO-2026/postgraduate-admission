package com.example.backend.model.declaration;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping ("api/applications")
@RequiredArgsConstructor
public class DeclarationController {

    private final DeclarationService declarationService;

    @GetMapping("/{id}/declaration")
    public ResponseEntity<byte[]> getDeclaration(@PathVariable Long id) {
        return declarationService.generateDeclarationPdf(id);
    }
}
