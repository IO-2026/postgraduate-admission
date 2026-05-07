package com.example.backend.model.declaration;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/declarations")
@RequiredArgsConstructor
public class DeclarationController{

    private final DeclarationService declarationService;

    @GetMapping("/{applicationId}")
    public ResponseEntity<byte[]> getDeclaration(@PathVariable Long applicationId) {

        byte[] pdf = declarationService.generateDeclarationPdf(applicationId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("oswiadczenie_" + applicationId + ".pdf")
                .build());

        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }
}
